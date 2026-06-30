import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateChatModalComponent } from './create-chat-modal-component';

describe('CreateChatModalComponent', () => {
  let component: CreateChatModalComponent;
  let fixture: ComponentFixture<CreateChatModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateChatModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateChatModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
