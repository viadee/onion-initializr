import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-browser-warning',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './browser-warning.component.html',
  styleUrls: ['./browser-warning.component.scss'],
})
export class BrowserWarningComponent implements OnInit {
  isVisible = false;
  isWebKit = false;

  ngOnInit(): void {
    this.checkBrowser();
  }

  private checkBrowser(): void {
    this.isWebKit =
      /webkit/i.test(navigator.userAgent) &&
      !/chrome/i.test(navigator.userAgent);

    if (this.isWebKit) {
      this.isVisible = true;
    }
  }

  dismiss(): void {
    this.isVisible = false;
  }

  continueAnyway(): void {
    this.isVisible = false;
  }
}
