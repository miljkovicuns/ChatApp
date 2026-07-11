import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedMessagesComponent } from './saved-messages-component';

describe('SavedMessagesComponent', () => {
  let component: SavedMessagesComponent;
  let fixture: ComponentFixture<SavedMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedMessagesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedMessagesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
