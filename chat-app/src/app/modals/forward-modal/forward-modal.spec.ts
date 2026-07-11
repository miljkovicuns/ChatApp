import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForwardModal } from './forward-modal';

describe('ForwardModal', () => {
  let component: ForwardModal;
  let fixture: ComponentFixture<ForwardModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForwardModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ForwardModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
