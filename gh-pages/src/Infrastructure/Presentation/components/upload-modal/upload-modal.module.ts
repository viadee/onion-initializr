import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { container } from '../../../Configuration/awilix.config';
import { OnionConfigValidationService } from '../../../../../../lib/Domain/Services/OnionConfigValidationService';
import { OnionConfig } from '../../../../../../lib/Domain/Entities/OnionConfig';
import { InputSanitizationService } from '../../../../Application/Services/InputSanitizationService';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-json-upload-modal',
  templateUrl: './upload-modal.module.html',
  styleUrls: ['./upload-modal.scss'],
})
export class JsonUploadModalComponent {
  @Input() isOpen: boolean = false;
  @Output() fileUploaded = new EventEmitter<OnionConfig>();
  @Output() modalClosed = new EventEmitter<void>();

  isDragOver: boolean = false;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  selectedFile: File | null = null;
  validationErrors: string[] = [];

  private readonly validationService: OnionConfigValidationService;
  private readonly sanitizationService: InputSanitizationService;

  constructor() {
    this.validationService = container.resolve<OnionConfigValidationService>(
      'onionConfigValidationService'
    );
    this.sanitizationService = container.resolve<InputSanitizationService>(
      'inputSanitizationService'
    );
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
    this.isOpen = false;
    this.selectedFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.validationErrors = [];
    this.modalClosed.emit();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    // Simulate upload progress
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.processFile();
      }
    }, 100);
  }

  private processFile() {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        // SECURITY: Sanitize uploaded JSON data before validation
        const sanitizationResult =
          this.sanitizationService.validateOnionConfigJson(jsonData);

        if (!sanitizationResult.isValid) {
          console.error(
            'Uploaded configuration contains invalid or malicious data.'
          );
          this.validationErrors = [
            sanitizationResult.errorMessage || 'Invalid data in JSON file',
          ];
          this.isUploading = false;
          this.uploadProgress = 0;
          return;
        }

        // Parse the sanitized JSON
        const sanitizedData = JSON.parse(sanitizationResult.sanitizedValue);

        const validation =
          this.validationService.validateConfigStructure(sanitizedData);

        if (!validation.valid) {
          console.error('Uploaded configuration is invalid.');
          this.validationErrors = validation.errors; // <- store errors
          this.isUploading = false;
          this.uploadProgress = 0;
          return;
        }

        this.validationErrors = []; // clear previous errors
        this.fileUploaded.emit(sanitizedData);
        this.closeModal();
      } catch (error) {
        console.error('Error parsing JSON:', error);
        this.validationErrors = ['Invalid JSON format.'];
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    };
    reader.readAsText(this.selectedFile);
  }
}
