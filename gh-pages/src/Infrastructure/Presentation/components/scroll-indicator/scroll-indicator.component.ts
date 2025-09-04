import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-indicator.component.html',
  styleUrls: ['./scroll-indicator.component.scss'],
})
export class ScrollIndicatorComponent implements OnInit, OnDestroy {
  isVisible = true;
  isAnimating = true;

  ngOnInit() {
    this.checkScrollPosition();
  }

  ngOnDestroy() {
    // Component cleanup if needed
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.checkScrollPosition();
  }

  private checkScrollPosition() {
    const scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Hide indicator if user has scrolled down or if page is not scrollable
    this.isVisible =
      scrollPosition < 100 && documentHeight > windowHeight + 200;
  }

  scrollDown() {
    const firstSection =
      document.querySelector('.framework-buttons') || document.body;
    firstSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
