import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationReview } from './registration-review';

describe('RegistrationReview', () => {
  let component: RegistrationReview;
  let fixture: ComponentFixture<RegistrationReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationReview],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationReview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
