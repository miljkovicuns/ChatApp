import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSettingsModal } from './group-settings-modal';

describe('GroupSettingsModal', () => {
  let component: GroupSettingsModal;
  let fixture: ComponentFixture<GroupSettingsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupSettingsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupSettingsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
