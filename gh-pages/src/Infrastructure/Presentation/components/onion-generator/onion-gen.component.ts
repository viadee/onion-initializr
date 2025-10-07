import { Component, Output, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Diagram } from '../diagramm/diagram.component';
import { ScrollIndicatorComponent } from '../scroll-indicator/scroll-indicator.component';
import { ApplicationServiceService } from '../../../../../../lib/Domain/Services/ApplicationServiceService';
import { EntityService } from '../../../../../../lib/Domain/Services/EntitityService';
import { DomainServiceService } from '../../../../../../lib/Domain/Services/DomainServiceService';
import { IRepoService } from '../../../../../../lib/Domain/Services/IRepoService';
import { Subscription } from 'rxjs';
import { container } from '../../../Configuration/awilix.config';
import { YouTubeModalComponent } from '../youtube-modal/youtube-modal.component';
import { BrowserWarningComponent } from '../browser-warning/browser-warning.component';
import { IFileRepository } from '../../../../../../lib/Domain/Interfaces/IFileRepository';
import { ProgressTrackingAppService } from '../../../../Application/Services/ProgressTrackingAppService';
import { DiFramework } from '../../../../../../lib/Domain/Entities/DiFramework';
import {
  UiLibrary,
  getAvailableUiLibrariesForFramework,
} from '../../../../../../lib/Domain/Entities/UiLibrary';
import { DomainService } from '../../../../../../lib/Domain/Entities/DomainService';
import { Entity } from '../../../../../../lib/Domain/Entities/Entity';
import { UIFrameworks } from '../../../../../../lib/Domain/Entities/UiFramework';

@Component({
  selector: 'onion-gen',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    Diagram,
    ScrollIndicatorComponent,
    BrowserWarningComponent,
  ],
  templateUrl: './onion-gen.component.html',
  styleUrls: ['./onion-gen.component.scss'],
})
export class OnionGenComponent implements OnInit, OnDestroy {
  private static readonly TEMPLATE_PATHS = {
    ENTITY: 'entity.hbs',
    DOMAIN_SERVICE: 'domainService.hbs',
    APPLICATION_SERVICE: 'appService.hbs',
    REPOSITORY_INTERFACE: 'repositoryInterface.hbs',
  } as const;

  private static readonly DEPENDENCY_INJECTION_FRAMEWORK: DiFramework =
    'awilix' as const;
  private static readonly DEFAULT_FRAMEWORK = 'react' as const;
  private static readonly DEFAULT_PROJECT_NAME = 'MyProject' as const;

  @Output() uiFramework: keyof UIFrameworks = 'vanilla';
  @ViewChild('diagramRef') diagramComponent!: Diagram;

  projectForm: FormGroup;
  selectedNode: string | null = null;
  frameworks = ['angular', 'lit', 'react', 'vue', 'vanilla'];
  diFrameworks: DiFramework[] = ['awilix', 'angular'];
  uiLibraries: UiLibrary[] = ['none'];
  generatedCode: string = ``;

  filename: string = '';
  private isProgressRunning = false;
  private readonly progressSubscription?: Subscription;
  private readonly entityService: EntityService;
  private readonly domainService: DomainServiceService;
  private readonly applicationService: ApplicationServiceService;
  private readonly iRepoService: IRepoService;
  private readonly fileRepository: IFileRepository;
  private readonly progressTrackingAppService: ProgressTrackingAppService;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly dialog: MatDialog
  ) {
    this.projectForm = this.fb.group({
      name: [OnionGenComponent.DEFAULT_PROJECT_NAME],
      framework: [OnionGenComponent.DEFAULT_FRAMEWORK],
      diFramework: [OnionGenComponent.DEPENDENCY_INJECTION_FRAMEWORK],
      uiLibrary: ['none'],
    });
    this.entityService = container.resolve<EntityService>('entityService');
    this.domainService = container.resolve<DomainServiceService>(
      'domainServiceService'
    );
    this.applicationService = container.resolve<ApplicationServiceService>(
      'applicationServiceService'
    );
    this.iRepoService = container.resolve<IRepoService>('iRepoService');
    this.fileRepository = container.resolve<IFileRepository>('fileRepository');
    this.progressTrackingAppService =
      container.resolve<ProgressTrackingAppService>(
        'progressTrackingAppService'
      );

    // Subscribe to progress changes
    this.progressSubscription =
      this.progressTrackingAppService.progress$.subscribe(state => {
        this.isProgressRunning = state.isRunning;
      });
  }

  ngOnInit(): void {
    this.showTutorialModal();
  }

  ngOnDestroy(): void {
    this.progressSubscription?.unsubscribe();
  }

  public getFrameworkIconPath(framework: string): string {
    const iconMap: Record<string, string> = {
      angular: 'angular.svg',
      react: 'react.svg',
      vue: 'vue.svg',
      lit: 'lit.svg',
      vanilla: 'typescript.svg',
    };

    return iconMap[framework] || 'typescript.svg';
  }

  public getDiFrameworkIconPath(diFramework: DiFramework): string {
    const iconMap: Record<DiFramework, string> = {
      angular: 'angular.svg',
      awilix: 'typescript.svg',
    };

    return iconMap[diFramework] || 'typescript.svg';
  }

  public onFrameworkChange(framework: string): void {
    this.projectForm.get('framework')?.setValue(framework);

    // Set default DI framework based on UI framework
    if (framework === 'angular') {
      // Keep current DI framework for Angular (angular or awilix)
    } else if (framework === 'react') {
      // Default to awilix for React, but allow user to choose
      if (
        !this.projectForm.get('diFramework')?.value ||
        this.projectForm.get('diFramework')?.value === 'angular'
      ) {
        this.projectForm.get('diFramework')?.setValue('awilix');
      }
    } else {
      // Other frameworks must use Awilix
      this.projectForm.get('diFramework')?.setValue('awilix');
    }

    // Update UI library options and reset if not available
    this.updateUiLibraries();
    const currentUiLibrary = this.projectForm.get('uiLibrary')?.value;
    if (!this.uiLibraries.includes(currentUiLibrary)) {
      this.projectForm.get('uiLibrary')?.setValue('none');
    }
  }

  public onDiFrameworkChange(diFramework: DiFramework): void {
    this.projectForm.get('diFramework')?.setValue(diFramework);
  }

  getDiFrameworkDisplayName(diFramework: DiFramework): string {
    switch (diFramework) {
      case 'angular':
        return 'Angular DI';
      case 'awilix':
      default:
        return 'Awilix';
    }
  }

  shouldShowDiFrameworkSelection(): boolean {
    const framework = this.projectForm.get('framework')?.value;
    return framework === 'angular';
  }

  shouldShowUiLibrarySelection(): boolean {
    const framework = this.projectForm.get('framework')?.value;
    return framework === 'react';
  }

  selectedDiFramework(): DiFramework {
    return this.projectForm.get('diFramework')?.value || 'awilix';
  }

  selectedUiLibrary(): UiLibrary {
    return this.projectForm.get('uiLibrary')?.value || 'none';
  }

  getAvailableUiLibraries(): UiLibrary[] {
    const framework = this.projectForm.get('framework')?.value;
    return getAvailableUiLibrariesForFramework(framework);
  }

  getUiLibraryDisplayName(uiLibrary: UiLibrary): string {
    switch (uiLibrary) {
      case 'shadcn':
        return 'ShadCN';
      case 'none':
      default:
        return 'None';
    }
  }

  getUiLibraryIconPath(uiLibrary: UiLibrary): string {
    const iconMap: Record<UiLibrary, string> = {
      none: 'typescript.svg',
      shadcn: 'shadcn.png',
    };

    return iconMap[uiLibrary] || 'typescript.svg';
  }

  public onUiLibraryChange(uiLibrary: UiLibrary): void {
    this.projectForm.get('uiLibrary')?.setValue(uiLibrary);
    this.updateUiLibraries();
  }

  private updateUiLibraries(): void {
    const framework = this.projectForm.get('framework')?.value;
    this.uiLibraries = getAvailableUiLibrariesForFramework(framework);
  }

  public async generate() {
    if (!this.diagramComponent) {
      // Fallback to the original logic for code preview
      const nodeName = this.selectedNode || 'placeholder';
      this.filename = `${nodeName}.ts`;
      return;
    }

    // Delegate to the diagram component's combined generate and download method
    await this.diagramComponent.generateAndDownloadProject();
  }

  async onNodeSelected(
    node: {
      name: string;
      entities: Entity[];
      domainServices: DomainService[];
      repositories?: string[];
      type: string;
    } | null
  ) {
    if (!node) return;

    this.selectedNode = node.name;
    this.filename = `${node.name}.ts`;

    try {
      const code = await this.generateCodeByNodeType(node);
      this.generatedCode = code;
    } catch (error) {
      console.error(
        `Error generating code for ${node.type} '${node.name}':`,
        error
      );
      this.generatedCode = `// Error generating code: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async generateCodeByNodeType(node: {
    name: string;
    entities: Entity[];
    domainServices: DomainService[];
    repositories?: string[];
    type: string;
  }): Promise<string> {
    switch (node.type) {
      case 'entity':
        return await this.generateEntityCode(node.name);

      case 'domain':
        return await this.generateDomainServiceCode(node.name, node.entities);

      case 'application':
        return await this.generateApplicationServiceCode(
          node.name,
          node.domainServices,
          node.repositories || []
        );

      case 'repository':
        return await this.generateRepositoryInterfaceCode(node.name);

      default:
        return `// Unknown node type: ${node.type}`;
    }
  }
  public handleProjectNameChange(projectName: string) {
    console.log('Project name changed:', projectName);
  }

  public get isGenerating(): boolean {
    return this.isProgressRunning;
  }

  private parseEntityNameFromRepository(repositoryName: string): string {
    if (
      repositoryName.startsWith('I') &&
      repositoryName.endsWith('Repository')
    ) {
      const entityName = repositoryName.substring(
        1,
        repositoryName.length - 'Repository'.length
      );
      return entityName;
    }
    return repositoryName;
  }

  private async generateEntityCode(nodeName: string): Promise<string> {
    const template = await this.fileRepository.readTemplate(
      OnionGenComponent.TEMPLATE_PATHS.ENTITY
    );
    return this.entityService.generateEntityCodeFromTemplate(
      template.content,
      nodeName
    );
  }

  private async generateDomainServiceCode(
    nodeName: string,
    entities: Entity[]
  ): Promise<string> {
    const template = await this.fileRepository.readTemplate(
      OnionGenComponent.TEMPLATE_PATHS.DOMAIN_SERVICE
    );
    const selectedDiFramework = this.selectedDiFramework();
    return this.domainService.generateDomainServiceCodeFromTemplate(
      template.content,
      nodeName,
      selectedDiFramework,
      entities
    );
  }

  private async generateApplicationServiceCode(
    nodeName: string,
    domainServices: DomainService[],
    repositories: string[]
  ): Promise<string> {
    const template = await this.fileRepository.readTemplate(
      OnionGenComponent.TEMPLATE_PATHS.APPLICATION_SERVICE
    );
    const selectedDiFramework = this.selectedDiFramework();
    return this.applicationService.generateApplicationServiceCodeFromTemplate(
      template.content,
      nodeName,
      selectedDiFramework,
      {
        domainServices: domainServices.map(ds => ds.serviceName),
        repositories: repositories,
      }
    );
  }

  private async generateRepositoryInterfaceCode(
    nodeName: string
  ): Promise<string> {
    const entityName = this.parseEntityNameFromRepository(nodeName);
    const template = await this.fileRepository.readTemplate(
      OnionGenComponent.TEMPLATE_PATHS.REPOSITORY_INTERFACE
    );
    return this.iRepoService.generateRepositoryInterfaceCode(
      template.content,
      entityName
    );
  }

  private showTutorialModal(): void {
    // Check if user has already seen the tutorial modal
    if (!YouTubeModalComponent.hasUserSeenModal()) {
      const dialogRef = this.dialog.open(YouTubeModalComponent, {
        width: '90%',
        maxWidth: '800px',
        disableClose: true,
        panelClass: 'youtube-modal-dialog',
        hasBackdrop: true,
        backdropClass: 'youtube-modal-backdrop',
      });

      dialogRef.afterClosed().subscribe(() => {
        // Modal is automatically marked as seen in the component
      });
    }
  }

  showTutorialModalManually(): void {
    // Always show the modal when manually triggered, regardless of previous views
    const dialogRef = this.dialog.open(YouTubeModalComponent, {
      width: '90%',
      maxWidth: '800px',
      disableClose: false, // Allow closing when manually opened
      panelClass: 'youtube-modal-dialog',
      hasBackdrop: true,
      backdropClass: 'youtube-modal-backdrop',
    });

    dialogRef.afterClosed().subscribe(() => {});
  }

  navigateHome(): void {
    this.router.navigate(['home']);
  }
}
