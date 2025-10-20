import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CodeDisplayComponent } from '../code-display/code-display.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { JsonUploadModalComponent } from '../upload-modal/upload-modal.module';
import {
  ProgressModalComponent,
  ProgressModalData,
} from '../progress-modal/progress-modal.component';
import { container } from '../../../Configuration/awilix.config';
import { OnionConfigService } from '../../../../../../lib/Domain/Services/onion-config-service';
import { DiagramAppService } from '../../../../Application/Services/diagram-app-service';
import { DiagramConnectionAppService } from '../../../../Application/Services/diagram-connection-app-service';
import { DiagramNodeInteractionAppService } from '../../../../Application/Services/diagram-node-interaction-app-service';
import { DiagramNodeManagementService } from '../../../../Application/Services/diagram-node-management-app-service';
import { DiagramProjectGenerationService } from '../../../../Application/Services/diagram-project-generation-app-service';
import { ProgressTrackingAppService } from '../../../../Application/Services/progress-tracking-app-service';
import { WebContainerAppService } from '../../../../Application/Services/web-container-app-service';
import { DiFramework } from '../../../../../../lib/Domain/Entities/di-framework';
import { DomainService } from '../../../../../../lib/Domain/Entities/domain-service';
import { Entity } from '../../../../../../lib/Domain/Entities/Entity';
import { NodeType } from '../../../../../../lib/Domain/Entities/node-type';
import { UIFrameworks } from '../../../../../../lib/Domain/Entities/ui-framework';
import { UiLibrary } from '../../../../../../lib/Domain/Entities/ui-library';
import { OnionConfig } from '../../../../../../lib/Domain/Entities/onion-config';

type StatusType = 'success' | 'error' | 'info';

// Constants for clean code
const PROGRESS_CONSTANTS = {
  DELAYS: {
    SHORT: 500,
    MEDIUM: 1000,
    SUCCESS_MESSAGE: 3000,
    ERROR_MESSAGE: 5000,
  },
} as const;

const UI_MESSAGES = {
  ERRORS: {
    NO_SELECTED_NODE: 'Please select a node to remove',
    GENERATION_FAILED: 'Failed to generate project',
    CROSS_ORIGIN_ERROR:
      'WebContainer requires cross-origin isolation. Please restart the Angular dev server.',
    UNEXPECTED_ERROR: 'Unexpected error occurred',
  } as const,
  SUCCESS: {
    NODE_REMOVED: 'Removed "{0}" successfully',
    PROJECT_GENERATED: 'Project generated and downloaded successfully!',
  } as const,
};

@Component({
  selector: 'diagram',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CodeDisplayComponent,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    JsonUploadModalComponent,
  ],
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
})
export class Diagram implements OnInit, OnDestroy {
  public showDataSummary: boolean = false;
  @ViewChild('containerRef', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;
  @Input() filename: string = 'onion-architecture.json';
  @Input() generatedCode: string = 'placeholder';
  @Input() selectedFramework: keyof UIFrameworks = 'vanilla';
  @Input() selectedDiFramework: DiFramework = 'awilix';
  data: OnionConfig = {
    entities: [],
    domainServices: [],
    applicationServices: [],
    folderPath: '',
    domainServiceConnections: {},
    applicationServiceDependencies: {},
    uiFramework: 'vanilla' as keyof UIFrameworks,
    diFramework: 'awilix' as DiFramework,
    uiLibrary: 'none' as UiLibrary,
  };
  @Output() nodeSelected = new EventEmitter<{
    name: string;
    type: string;
    entities: Entity[];
    domainServices: DomainService[];
    repositories: string[];
  } | null>();
  @Output() projectNameChange = new EventEmitter<string>();
  projectName: string = '';
  selectedNode: string | null = null;
  newNodeName = '';
  nodeType: NodeType = NodeType.ENTITY;

  // Available targets for current connection
  availableTargets: string[] = [];
  currentConnections: string[] = [];

  // UI messages
  statusMessage = '';
  statusType: StatusType = 'info';
  private readonly diagramAppService: DiagramAppService;
  private readonly onionConfigService: OnionConfigService;
  private readonly webContainerService: WebContainerAppService;
  private readonly progressTrackingAppService: ProgressTrackingAppService;
  private readonly diagramNodeInteractionService: DiagramNodeInteractionAppService;
  private readonly diagramNodeManagementService: DiagramNodeManagementService;
  private readonly diagramConnectionService: DiagramConnectionAppService;
  private readonly diagramProjectGenerationService: DiagramProjectGenerationService;
  showUploadModal = false;

  // WebContainer properties
  webContainerProjectGenerated = false;
  webContainerProjectInfo: {
    filesCreated?: string[];
    applicationUrl?: string;
  } | null = null;

  openUploadModal() {
    this.showUploadModal = true;
  }
  onFileUploaded(data: OnionConfig) {
    this.data = data;
    this.renderDiagram();
  }

  onModalClosed() {
    this.showUploadModal = false;
  }
  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.diagramAppService =
      container.resolve<DiagramAppService>('diagramAppService');
    this.onionConfigService =
      container.resolve<OnionConfigService>('onionConfigService');
    this.webContainerService = container.resolve<WebContainerAppService>(
      'webContainerService'
    );
    this.progressTrackingAppService =
      container.resolve<ProgressTrackingAppService>(
        'progressTrackingAppService'
      );
    this.diagramNodeInteractionService =
      container.resolve<DiagramNodeInteractionAppService>(
        'diagramNodeInteractionService'
      );
    this.diagramNodeManagementService =
      container.resolve<DiagramNodeManagementService>(
        'diagramNodeManagementService'
      );
    this.diagramConnectionService =
      container.resolve<DiagramConnectionAppService>(
        'diagramConnectionService'
      );
    this.diagramProjectGenerationService =
      container.resolve<DiagramProjectGenerationService>(
        'diagramProjectGenerationService'
      );
  }

  ngOnInit(): void {
    this.loadDataAndRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedFramework']) {
      this.data.uiFramework = this.selectedFramework;

      // Enforce rule: non-Angular frameworks must use Awilix
      if (this.selectedFramework !== 'angular') {
        this.selectedDiFramework = 'awilix';
        this.data.diFramework = 'awilix';
      }
    }
    if (changes['selectedDiFramework']) {
      this.data.diFramework = this.selectedDiFramework;
    }
  }

  onProjectNameChange() {
    this.data.folderPath = this.projectName;
  }

  private async loadDataAndRender(): Promise<void> {
    this.data = await this.onionConfigService.loadData();
    this.renderDiagram();
  }

  ngOnDestroy(): void {
    // nothing to clean up yet
  }
  getEmptyConfig(): void {
    this.data = this.onionConfigService.getEmptyConfig();
    this.renderDiagram();
  }

  private renderDiagram(): void {
    if (!this.containerRef?.nativeElement) return;

    this.diagramAppService.createDiagram(
      this.containerRef.nativeElement,
      this.data,
      (clicked: string | null) => {
        this.handleNodeClick(clicked);
      },
      this.selectedNode,
      () => {
        this.handleBackgroundClick();
      }
    );
  }

  private handleNodeClick(clickedNode: string | null): void {
    if (!clickedNode) return;

    const nodeInfo = this.determineNodeInfo(clickedNode);

    // Always update selected node for UI visibility (remove button, etc.)
    // If clicking the same node, deselect it; if clicking a different node, select it
    this.selectedNode = this.selectedNode === clickedNode ? null : clickedNode;

    // Re-render diagram immediately to show visual selection change (yellow backdrop)
    this.renderDiagram();
    this.cdr.detectChanges(); // Force change detection
    this.updateNodeInfo();

    if (this.isConnectionModeActive) {
      this.handleConnectionModeClick(clickedNode);
      this.nodeSelected.emit({
        name: clickedNode,
        entities: nodeInfo.entities,
        domainServices: nodeInfo.domainServices,
        repositories: nodeInfo.repositories,
        type: nodeInfo.type,
      });
    }
  }

  private handleBackgroundClick(): void {
    // Deselect the current node
    this.selectedNode = null;
    this.renderDiagram();
    this.cdr.detectChanges();
    this.updateNodeInfo();
  }

  private determineNodeInfo(clickedNode: string): {
    type: NodeType;
    entities: Entity[];
    domainServices: DomainService[];
    repositories: string[];
  } {
    return this.diagramNodeInteractionService.determineNodeInfo(
      clickedNode,
      this.data
    );
  }

  private handleConnectionModeClick(clickedNode: string): void {
    const result =
      this.diagramConnectionService.handleConnectionModeClick(clickedNode);

    if (result.success) {
      if (result.data) {
        this.data = result.data;
        this.renderDiagram();
        this.updateNodeInfo();
      }
      this.snackBar.open(result.message, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.SUCCESS_MESSAGE,
      });
    } else {
      this.snackBar.open(result.message, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
    }

    if (result.shouldClearConnection) {
      this.clearStatusMessage();
    }
  }

  private updateNodeInfo(): void {
    if (!this.selectedNode) {
      this.currentConnections = [];
      return;
    }

    this.currentConnections =
      this.diagramConnectionService.getCurrentConnections(this.selectedNode);
  }

  handleAddNode(): void {
    const validation = this.diagramNodeManagementService.validateNodeName(
      this.newNodeName,
      this.data
    );
    if (!validation.isValid) {
      this.snackBar.open(validation.errorMessage!, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
      return;
    }

    const result = this.diagramNodeManagementService.addNode(
      this.newNodeName.trim(),
      this.nodeType
    );

    if (result.success) {
      this.data = result.data!;
      this.newNodeName = '';
      this.renderDiagram();
    } else {
      this.snackBar.open(result.message, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
    }
  }

  handleRemoveNode(): void {
    if (!this.selectedNode) {
      this.snackBar.open(UI_MESSAGES.ERRORS.NO_SELECTED_NODE, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
      return;
    }

    const result = this.diagramNodeManagementService.removeNode(
      this.selectedNode
    );

    if (result.success) {
      this.data = result.data!;
      const removedNode = result.clearedNode || this.selectedNode;
      this.selectedNode = null;
      this.currentConnections = [];
      this.renderDiagram();
      this.snackBar.open(
        UI_MESSAGES.SUCCESS.NODE_REMOVED.replace('{0}', removedNode),
        'Close',
        {
          duration: PROGRESS_CONSTANTS.DELAYS.SUCCESS_MESSAGE,
        }
      );
    } else {
      this.snackBar.open(result.message, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
    }
  }

  removeConnection(target: string): void {
    if (!this.selectedNode) return;

    const result = this.diagramConnectionService.removeConnection(
      this.selectedNode,
      target
    );

    if (result.success && result.data) {
      this.data = result.data;
      this.updateNodeInfo();
      this.renderDiagram();
      this.snackBar.open(result.message, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.SUCCESS_MESSAGE,
      });
    } else {
      this.snackBar.open(result.message, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
    }
  }

  // WebContainer methods
  async generateAndDownloadProject(): Promise<void> {
    // Validate configuration using the specialized service
    const validation =
      this.diagramProjectGenerationService.validateProjectGeneration(this.data);
    if (!validation.isValid) {
      this.snackBar.open(validation.errorMessage!, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
      return;
    }

    // Get progress steps from the service
    const progressSteps =
      this.diagramProjectGenerationService.createProgressSteps();

    // Open progress modal
    const dialogRef = this.dialog.open(ProgressModalComponent, {
      width: '600px',
      disableClose: false,
      panelClass: 'light-theme-dialog',
      data: {
        title: 'Generating Onion Architecture Project',
        steps: progressSteps,
        allowCancel: false,
      } as ProgressModalData,
    });

    try {
      // Use the specialized service for generation
      const result = await this.diagramProjectGenerationService.generateProject(
        this.data,
        this.selectedFramework,
        this.selectedDiFramework
      );

      if (result.success) {
        this.webContainerProjectGenerated = true;
        this.webContainerProjectInfo = {
          filesCreated: result.filesCreated,
          applicationUrl: result.applicationUrl,
        };

        // After successful generation, proceed with download
        const downloadResult =
          await this.diagramProjectGenerationService.downloadProject();

        if (downloadResult.success) {
          this.snackBar.open(UI_MESSAGES.SUCCESS.PROJECT_GENERATED, 'Close', {
            duration: PROGRESS_CONSTANTS.DELAYS.SUCCESS_MESSAGE,
          });
        } else {
          this.snackBar.open('Project generated but download failed', 'Close', {
            duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
          });
        }
      } else {
        this.progressTrackingAppService.setError(
          'framework-setup',
          result.message
        );
        this.snackBar.open(UI_MESSAGES.ERRORS.GENERATION_FAILED, 'Close', {
          duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
        });
      }
    } catch (error) {
      let errorMessage: string = UI_MESSAGES.ERRORS.UNEXPECTED_ERROR;

      // Check for cross-origin isolation error
      if (
        error instanceof Error &&
        error.message.includes('cross-origin isolation')
      ) {
        errorMessage = UI_MESSAGES.ERRORS.CROSS_ORIGIN_ERROR;
      }

      this.progressTrackingAppService.setError('framework-setup', errorMessage);
      this.snackBar.open(errorMessage, 'Close', {
        duration: PROGRESS_CONSTANTS.DELAYS.ERROR_MESSAGE,
      });
    }

    // Handle dialog result
    dialogRef.afterClosed().subscribe(result => {
      if (result?.cancelled) {
        this.progressTrackingAppService.reset();
      }
    });
  }
  public saveData(): void {
    this.onionConfigService.saveData(this.data);
  }

  public clearStatusMessage(): void {
    this.statusMessage = '';
  }

  // Getter methods for template
  get isConnectionModeActive(): boolean {
    return this.diagramConnectionService.getConnectionMode().active;
  }

  get connectionSourceNode(): string | null {
    return this.diagramConnectionService.getConnectionMode().sourceNode;
  }

  get hasSelectedNode(): boolean {
    return this.selectedNode !== null;
  }

  get selectedNodeRing(): string {
    if (!this.selectedNode) return '';

    if (this.data.entities?.includes(this.selectedNode)) return 'Entity';
    if (this.data.domainServices?.includes(this.selectedNode))
      return 'Domain Service';
    if (this.data.applicationServices?.includes(this.selectedNode))
      return 'Application Service';
    if (this.repositories.includes(this.selectedNode)) return 'Repository';

    return '';
  }

  get canInitiateConnections(): boolean {
    return this.diagramConnectionService.canInitiateConnections(
      this.selectedNode
    );
  }

  // Get repositories derived from entities
  get repositories(): string[] {
    const repositories = new Set<string>();

    // Add entity-based repositories
    this.data.entities?.forEach(entity => {
      repositories.add(`I${entity}Repository`);
    });

    // Add infrastructure repositories from applicationServiceDependencies
    if (this.data.applicationServiceDependencies) {
      Object.values(this.data.applicationServiceDependencies).forEach(deps => {
        deps.repositories?.forEach(repo => {
          repositories.add(repo);
        });
      });
    }

    return Array.from(repositories);
  }

  // Getter for WebContainer UI
  get hasEntitiesForGeneration(): boolean {
    return this.data.entities && this.data.entities.length > 0;
  }

  getCrossOriginStatus(): { type: StatusType; message: string } {
    const status = this.diagramProjectGenerationService.getCrossOriginStatus();
    return {
      type: status.type,
      message: status.message,
    };
  }

  get isCrossOriginIsolated(): boolean {
    return window.crossOriginIsolated || false;
  }
}
