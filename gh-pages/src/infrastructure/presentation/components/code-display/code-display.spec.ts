import { TestBed } from '@angular/core/testing';

import { CodeDisplayComponent } from './code-display.component';
import { describe, it, beforeEach } from 'vitest';

describe('CodeDisplay', () => {
  let component: CodeDisplayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeDisplayComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CodeDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
