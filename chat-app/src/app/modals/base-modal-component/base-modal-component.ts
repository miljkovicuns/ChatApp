import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-base-modal-component',
  imports: [],
  templateUrl: './base-modal-component.html',
  styleUrl: './base-modal-component.css',
})
export class BaseModalComponent {
  @Input() title: string = '';
  @Input() data: any = null;
  @Output() close = new EventEmitter<any>();
  @Output() confirm = new EventEmitter<any>();

  // Method to close the modal
  closeModal(data?: any) {
    this.close.emit(data);
  }

  // Method to confirm and close
  confirmModal(data?: any) {
    this.confirm.emit(data);
  }

  // Handle escape key
  onEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  // Handle backdrop click
  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
}
