import { TestBed } from '@angular/core/testing';

import { CodeDisplayComponent } from './code-display.component';

describe('CodeDisplay', () => {
  let service: CodeDisplayComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodeDisplayComponent);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
