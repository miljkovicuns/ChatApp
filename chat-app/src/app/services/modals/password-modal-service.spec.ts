import { TestBed } from '@angular/core/testing';

import { PasswordModalService } from './password-modal-service';

describe('PasswordModalService', () => {
  let service: PasswordModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PasswordModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
