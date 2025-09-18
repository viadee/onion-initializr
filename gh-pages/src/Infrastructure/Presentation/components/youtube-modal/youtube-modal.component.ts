import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-youtube-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './youtube-modal.component.html',
  styleUrls: ['./youtube-modal.component.scss'],
})
export class YouTubeModalComponent implements OnInit {
  private readonly videoId = '_q-i1Fn3hOM';
  safeVideoUrl: SafeResourceUrl;

  constructor(
    public dialogRef: MatDialogRef<YouTubeModalComponent>,
    private readonly sanitizer: DomSanitizer
  ) {
    // Create safe YouTube embed URL with proper parameters for production
    // Using youtube-nocookie.com for better CORS compatibility
    const videoUrl = `https://www.youtube-nocookie.com/embed/${this.videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1`;
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  ngOnInit(): void {
    // Set flag in localStorage to remember user has seen the modal
    this.markModalAsSeen();
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  private markModalAsSeen(): void {
    localStorage.setItem('onion-tutorial-modal-seen', 'true');
  }

  static hasUserSeenModal(): boolean {
    return localStorage.getItem('onion-tutorial-modal-seen') === 'true';
  }

  static resetModalSeen(): void {
    localStorage.removeItem('onion-tutorial-modal-seen');
  }

  skipTutorial(): void {
    this.closeModal();
  }
}
