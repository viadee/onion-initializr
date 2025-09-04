import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CodeDisplayComponent } from '../code-display/code-display.component';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule, CodeDisplayComponent],
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
})
export class DocumentationComponent {
  constructor(private readonly router: Router) {}

  navigateHome(): void {
    this.router.navigate(['/home']);
  }

  navigateToGenerator(): void {
    this.router.navigate(['/generator']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
