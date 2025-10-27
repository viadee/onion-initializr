import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  label: string;
  icon?: string;
  svgPath?: string;
  action: () => void;
  disabled?: boolean;
}

@Component({
  selector: 'context-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
})
export class ContextMenuComponent {
  @Input() visible = false;
  @Input() position: ContextMenuPosition = { x: 0, y: 0 };
  @Input() items: ContextMenuItem[] = [];
  @Output() closeMenu = new EventEmitter<void>();

  constructor(private readonly elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.visible && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu.emit();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    if (this.visible && !this.elementRef.nativeElement.contains(event.target)) {
      event.preventDefault();
      this.closeMenu.emit();
    }
  }

  onItemClick(item: ContextMenuItem): void {
    if (!item.disabled) {
      item.action();
      this.closeMenu.emit();
    }
  }

  get menuStyle() {
    return {
      display: this.visible ? 'block' : 'none',
      left: `${this.position.x}px`,
      top: `${this.position.y}px`,
    };
  }
}
