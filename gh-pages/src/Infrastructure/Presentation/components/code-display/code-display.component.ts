import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/github.css';

@Component({
  selector: 'app-code-display',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './code-display.component.html',
  styleUrls: ['./code-display.component.scss'],
})
export class CodeDisplayComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() filename: string = '';
  @Input() content: string = '';
  @ViewChild('codeBlock') codeBlock!: ElementRef;
  @Input() code: string = '';

  lines: string[] = [];
  highlightedCode: string = '';
  isCopied: boolean = false;

  private static hljsInitialized = false;

  ngOnInit() {
    this.initHighlightJs();
    this.processContent();
  }

  ngAfterViewInit() {
    this.highlightBlock();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] || changes['filename']) {
      this.processContent();
      this.highlightBlock();
    }
  }

  private initHighlightJs() {
    if (!CodeDisplayComponent.hljsInitialized) {
      hljs.registerLanguage('typescript', typescript);
      CodeDisplayComponent.hljsInitialized = true;
    }
  }

  private processContent() {
    this.lines = this.content.split('\n');
    // highlightedCode is now just the raw code, highlight.js will process it in the view
    this.highlightedCode = this.content;
  }

  private highlightBlock() {
    if (this.codeBlock?.nativeElement) {
      const element = this.codeBlock.nativeElement;

      // Clear previous highlighting
      delete element.dataset.highlighted;
      element.className = element.className.replace(/\bhljs\b/g, '').trim();

      // Set content
      element.textContent = this.highlightedCode;

      // Add language class
      element.className += ' language-typescript';

      // Apply highlighting
      hljs.highlightElement(element);
    }
  }
  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.content);
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(this.content);
    }
  }

  private fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }
}
