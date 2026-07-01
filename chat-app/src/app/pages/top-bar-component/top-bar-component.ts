import {Component, EventEmitter, Input, Output} from '@angular/core';
import {User} from '../../models/user';
import {UpperCasePipe} from '@angular/common';

@Component({
  selector: 'app-top-bar',
  imports: [
    UpperCasePipe
  ],
  templateUrl: './top-bar-component.html',
  styleUrl: './top-bar-component.css',
})
export class TopBarComponent {
  @Input() currentUser: User | null = null;
  @Input() logoText: string = '💬 ChatApp';
  @Input() badgeText: string = '';
  @Input() customButtons: Array<{id: string, icon: string, title: string, action: () => void}> = [];

  @Output() onRefresh = new EventEmitter<void>();
  @Output() onSettings = new EventEmitter<void>();
  @Output() onLogout = new EventEmitter<void>();
}
