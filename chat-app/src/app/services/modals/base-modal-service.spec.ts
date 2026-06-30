import { TestBed } from '@angular/core/testing';

import { BaseModalService } from './base-modal-service';

describe('BaseModalService', () => {
  let service: BaseModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaseModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
