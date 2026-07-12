import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteModal } from './invite-modal';

describe('InviteModal', () => {
  let component: InviteModal;
  let fixture: ComponentFixture<InviteModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteModal],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
