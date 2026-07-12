import {ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-profile-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './profile-modal-component.html',
  styleUrl: './profile-modal-component.css',
})
export class ProfileModalComponent implements OnInit{
  @Input() isOpen: boolean = false;
  @Input() currentUser: any = null;
  @Input() isUpdating: boolean = false;
  @Input() error: string | null = null;
  @Input() profileImagePreview: string | SafeUrl | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ formData: any, file: File | null }>();
  @Output() fileSelected = new EventEmitter<File>();

  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  profileForm: FormGroup;
  selectedImageFile: File | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      phoneNumber: [''],
      bio: ['']
    });
  }

  ngOnInit() {
    if (this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username || '',
        email: this.currentUser.email || '',
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        phoneNumber: this.currentUser.phoneNumber || '',
        bio: this.currentUser.bio || ''
      });
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageFile = file;
      this.fileSelected.emit(file);
    }
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.save.emit({
        formData: this.profileForm.value,
        file: this.selectedImageFile
      });
    }
  }

  onClose() {
    this.close.emit();
  }

  getInitials(): string {
    const username = this.profileForm.get('username')?.value;
    return (username?.charAt(0) || 'U').toUpperCase();
  }
}
