import { BehaviorSubject, Observable } from 'rxjs';

export interface ProgressStep {
  id: string;
  label: string;
  weight: number; // Relative weight for progress calculation
  completed: boolean;
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface ProgressState {
  steps: ProgressStep[];
  currentStepIndex: number;
  overallProgress: number;
  isRunning: boolean;
  currentStep?: ProgressStep;
  estimatedTimeRemaining?: number;
  error?: string;
}

export class ProgressTrackingAppService {
  private readonly progressSubject = new BehaviorSubject<ProgressState>({
    steps: [],
    currentStepIndex: 0,
    overallProgress: 0,
    isRunning: false,
  });

  public progress$: Observable<ProgressState> =
    this.progressSubject.asObservable();

  private animationFrameId: number | null = null;
  private targetProgress = 0;
  private currentAnimatedProgress = 0;

  initializeProgress(steps: ProgressStep[]): void {
    this.progressSubject.next({
      steps: steps.map(step => ({ ...step, completed: false })),
      currentStepIndex: 0,
      overallProgress: 0,
      isRunning: true,
      currentStep: steps[0],
    });
    this.currentAnimatedProgress = 0;
    this.targetProgress = 0;
  }

  startStep(stepId: string): void {
    const currentState = this.progressSubject.value;
    const stepIndex = currentState.steps.findIndex(step => step.id === stepId);

    if (stepIndex === -1) {
      return;
    }

    const updatedSteps = [...currentState.steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      startTime: Date.now(),
    };

    this.progressSubject.next({
      ...currentState,
      steps: updatedSteps,
      currentStepIndex: stepIndex,
      currentStep: updatedSteps[stepIndex],
      estimatedTimeRemaining: this.calculateEstimatedTime(
        updatedSteps,
        stepIndex
      ),
    });
  }

  completeStep(stepId: string, nextStepProgress?: number): void {
    const currentState = this.progressSubject.value;
    const stepIndex = currentState.steps.findIndex(step => step.id === stepId);

    if (stepIndex === -1) {
      return;
    }

    const updatedSteps = [...currentState.steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      completed: true,
      endTime: Date.now(),
    };

    // Calculate progress based on completed steps and their weights
    const totalWeight = updatedSteps.reduce(
      (sum, step) => sum + step.weight,
      0
    );
    const completedWeight = updatedSteps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.weight, 0);

    // Add partial progress for current step if provided
    let currentStepProgress = 0;
    if (nextStepProgress && stepIndex + 1 < updatedSteps.length) {
      const nextStep = updatedSteps[stepIndex + 1];
      currentStepProgress = (nextStepProgress / 100) * nextStep.weight;
    }

    this.targetProgress = Math.min(
      100,
      ((completedWeight + currentStepProgress) / totalWeight) * 100
    );

    // Start smooth animation to target progress
    this.animateToTarget();

    const nextStepIndex = stepIndex + 1;
    this.progressSubject.next({
      ...currentState,
      steps: updatedSteps,
      currentStepIndex: nextStepIndex,
      currentStep:
        nextStepIndex < updatedSteps.length
          ? updatedSteps[nextStepIndex]
          : undefined,
      estimatedTimeRemaining: this.calculateEstimatedTime(
        updatedSteps,
        nextStepIndex
      ),
    });
  }

  updateStepProgress(stepId: string, progressPercentage: number): void {
    const currentState = this.progressSubject.value;
    const stepIndex = currentState.steps.findIndex(step => step.id === stepId);

    if (stepIndex === -1) {
      return;
    }

    // Auto-start step if it hasn't been started yet
    const step = currentState.steps[stepIndex];
    if (!step.startTime) {
      this.startStep(stepId);
      // Get updated state after starting the step
      const updatedState = this.progressSubject.value;
      this.updateStepProgressInternal(
        updatedState,
        stepIndex,
        progressPercentage
      );
      return;
    }

    this.updateStepProgressInternal(
      currentState,
      stepIndex,
      progressPercentage
    );
  }

  private updateStepProgressInternal(
    currentState: ProgressState,
    stepIndex: number,
    progressPercentage: number
  ): void {
    // Calculate overall progress including partial step progress
    const completedSteps = currentState.steps.slice(0, stepIndex);
    const totalWeight = currentState.steps.reduce(
      (sum, step) => sum + step.weight,
      0
    );
    const completedWeight = completedSteps.reduce(
      (sum, step) => sum + step.weight,
      0
    );
    const currentStepWeight = currentState.steps[stepIndex].weight;
    const currentStepProgress = (progressPercentage / 100) * currentStepWeight;

    this.targetProgress = Math.min(
      100,
      ((completedWeight + currentStepProgress) / totalWeight) * 100
    );
    this.animateToTarget();

    // Update state with estimated time remaining
    this.progressSubject.next({
      ...currentState,
      estimatedTimeRemaining: this.calculateEstimatedTime(
        currentState.steps,
        stepIndex
      ),
    });
  }

  setError(stepId: string, error: string): void {
    const currentState = this.progressSubject.value;
    const stepIndex = currentState.steps.findIndex(step => step.id === stepId);

    if (stepIndex !== -1) {
      const updatedSteps = [...currentState.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        error,
        endTime: Date.now(),
      };

      this.progressSubject.next({
        ...currentState,
        steps: updatedSteps,
        isRunning: false,
        error,
      });
    }
  }

  complete(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.targetProgress = 100;
    this.currentAnimatedProgress = 100;

    const currentState = this.progressSubject.value;
    this.progressSubject.next({
      ...currentState,
      overallProgress: 100,
      isRunning: false,
      currentStep: undefined,
    });
  }

  reset(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.currentAnimatedProgress = 0;
    this.targetProgress = 0;

    this.progressSubject.next({
      steps: [],
      currentStepIndex: 0,
      overallProgress: 0,
      isRunning: false,
    });
  }

  private animateToTarget(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const animate = () => {
      const difference = this.targetProgress - this.currentAnimatedProgress;

      if (Math.abs(difference) < 0.1) {
        this.currentAnimatedProgress = this.targetProgress;
        this.updateProgress();
        return;
      }

      // Smooth easing function - slower as we approach target
      this.currentAnimatedProgress += difference * 0.1;
      this.updateProgress();

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private updateProgress(): void {
    const currentState = this.progressSubject.value;
    this.progressSubject.next({
      ...currentState,
      overallProgress: this.currentAnimatedProgress,
    });
  }

  private calculateEstimatedTime(
    steps: ProgressStep[],
    currentIndex: number
  ): number | undefined {
    // Need at least one completed step to make an estimate
    const completedSteps = steps.filter(
      step => step.completed && step.startTime && step.endTime
    );

    if (completedSteps.length === 0) {
      return undefined;
    }

    // Calculate average time per weight unit from completed steps
    const totalCompletedTime = completedSteps.reduce((sum, step) => {
      return sum + (step.endTime! - step.startTime!);
    }, 0);

    const completedWeight = completedSteps.reduce(
      (sum, step) => sum + step.weight,
      0
    );
    const averageTimePerWeight = totalCompletedTime / completedWeight;

    // Calculate remaining weight (steps after current, plus current if not completed)
    const remainingSteps = steps.slice(currentIndex);
    const remainingWeight = remainingSteps
      .filter(step => !step.completed)
      .reduce((sum, step) => sum + step.weight, 0);

    // If current step is in progress, estimate its remaining time
    let currentStepRemainingTime = 0;
    const currentStep = steps[currentIndex];
    if (currentStep?.startTime && !currentStep.completed) {
      const currentStepElapsedTime = Date.now() - currentStep.startTime;
      const expectedCurrentStepTime = currentStep.weight * averageTimePerWeight;
      currentStepRemainingTime = Math.max(
        0,
        expectedCurrentStepTime - currentStepElapsedTime
      );
      // Subtract current step weight from remaining since we calculated its time separately
      const adjustedRemainingWeight = remainingWeight - currentStep.weight;
      return (
        adjustedRemainingWeight * averageTimePerWeight +
        currentStepRemainingTime
      );
    }

    return remainingWeight * averageTimePerWeight;
  }
}
