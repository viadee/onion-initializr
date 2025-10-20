import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import {
  ProgressTrackingAppService,
  ProgressState,
  ProgressStep,
} from '../../../../application/services/progress-tracking-app-service';
import { container } from '../../../configuration/awilix.config';

export interface ProgressModalData {
  title: string;
  steps: ProgressStep[];
  allowCancel?: boolean;
}

@Component({
  selector: 'app-progress-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './progress-modal.component.html',
  styleUrls: ['./progress-modal.component.scss'],
})
export class ProgressModalComponent implements OnInit, OnDestroy {
  progressState: ProgressState = {
    steps: [],
    currentStepIndex: 0,
    overallProgress: 0,
    isRunning: false,
  };

  data: ProgressModalData;
  private subscription?: Subscription;
  private readonly progressService: ProgressTrackingAppService;
  readonly Math = Math;

  constructor(
    public dialogRef: MatDialogRef<ProgressModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: ProgressModalData
  ) {
    this.data = data;
    this.progressService = container.resolve<ProgressTrackingAppService>(
      'progressTrackingAppService'
    );
  }

  ngOnInit(): void {
    this.subscription = this.progressService.progress$.subscribe(
      (state: ProgressState) => {
        this.progressState = state;

        // Auto-close modal when completed successfully
        // if (!state.isRunning && !state.error && state.overallProgress >= 100) {
        //   setTimeout(() => {
        //     this.dialogRef.close({ success: true });
        //   }, 1500);
        // }
        // Modal stays open when completed - user can close by clicking outside
      }
    );

    // Initialize progress tracking
    this.progressService.initializeProgress(this.data.steps);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  cancel(): void {
    this.dialogRef.close({ cancelled: true });
  }

  getStepIcon(step: ProgressStep): string {
    if (step.error) return 'error';
    if (step.completed) return 'check_circle';
    return 'settings';
  }

  formatTime(milliseconds: number): string {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatDuration(milliseconds: number): string {
    const seconds = (milliseconds / 1000).toFixed(1);
    return `${seconds}s`;
  }
}
