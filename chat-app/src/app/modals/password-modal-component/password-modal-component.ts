import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {BaseModalComponent} from '../base-modal-component/base-modal-component';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-password-modal-component',
  imports: [
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './password-modal-component.html',
  styleUrl: './password-modal-component.css',
})
export class PasswordModalComponent extends BaseModalComponent implements OnInit{
  @Input() userId: string = ''
  @Input() username: string = ''
  @Input() requiresCurrentPassword: boolean = true
  @Output() passwordUpdated = new EventEmitter<any>()

  passwordForm: FormGroup
  isLoading = false
  errorMessage: string = ''
  showCurrentPassword = false
  showNewPassword = false
  showConfirmPassword = false

  passwordStrength: number = 0
  passwordStrengthText: string = ''

  validationMessages = {
    currentPassword: {
      required: 'Current password is required'
    },
    newPassword: {
      required: 'New password is required',
      minlength: 'Password must be at least 8 characters',
      maxlength: 'Password cannot exceed 30 characters',
      hasUpperCase: 'Password must contain at least one uppercase letter',
      hasLowerCase: 'Password must contain at least one lowercase letter',
      hasNumber: 'Password must contain at least one number',
      hasSpecialChar: 'Password must contain at least one special character'
    },
    confirmPassword: {
      required: 'Please confirm your new password',
      mismatch: 'Passwords do not match'
    }
  };

  constructor(private fb: FormBuilder) {
    super();
    this.passwordForm = this.fb.group({
      currentPassword: ['', this.requiresCurrentPassword ? Validators.required : []],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(30),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: [
        this.passwordMatchValidator,
        this.passwordNotSameValidator
      ]
    });
  }

  ngOnInit(): void {
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(value => {
      this.updatePasswordStrength(value);
    });
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    const errors: any = {};

    if (!/[A-Z]/.test(value)) {
      errors.hasUpperCase = true;
    }
    if (!/[a-z]/.test(value)) {
      errors.hasLowerCase = true;
    }
    if (!/[0-9]/.test(value)) {
      errors.hasNumber = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.hasSpecialChar = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  passwordMatchValidator(group: FormGroup): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  passwordNotSameValidator(group: FormGroup): ValidationErrors | null {
    const currentPassword = group.get('currentPassword')?.value;
    const newPassword = group.get('newPassword')?.value;

    if (currentPassword && newPassword && currentPassword === newPassword) {
      group.get('newPassword')?.setErrors({ sameAsCurrent: true });
      return { sameAsCurrent: true };
    }
    return null;
  }

  updatePasswordStrength(password: string) {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Complexity checks
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    this.passwordStrength = Math.min(strength, 5);

    const strengthTexts = [
      'Very Weak',
      'Weak',
      'Fair',
      'Good',
      'Strong',
      'Very Strong'
    ];
    this.passwordStrengthText = strengthTexts[this.passwordStrength];
  }

  getPasswordStrengthColor(): string {
    const colors = [
      '#ff4444', // Very Weak - Red
      '#ff8800', // Weak - Orange
      '#ffcc00', // Fair - Yellow
      '#88cc00', // Good - Light Green
      '#44aa00', // Strong - Green
      '#00aa44'  // Very Strong - Dark Green
    ];
    return colors[this.passwordStrength] || colors[0];
  }

  getPasswordStrengthWidth(): string {
    return `${(this.passwordStrength / 5) * 100}%`;
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const control = this.passwordForm.get(fieldName);
    if (!control) return false;

    if (errorType) {
      return control.hasError(errorType) && (control.dirty || control.touched);
    }
    return control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.passwordForm.get(fieldName);
    if (!control) return '';

    const errors = control.errors;
    if (!errors) return '';

    const messages = this.validationMessages[fieldName as keyof typeof this.validationMessages];
    if (!messages) return '';

    const firstError = Object.keys(errors)[0];
    return messages[firstError as keyof typeof messages] || 'Invalid input';
  }

  togglePasswordVisibility(field: string) {
    switch(field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  // Submit form
  onSubmit() {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = {
      userId: this.userId,
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    // Emit the password data
    this.passwordUpdated.emit(formData);

    // Use the inherited confirmModal method to close with data
    this.confirmModal(formData);
  }

  onCancel() {
    // Use the inherited closeModal method
    this.closeModal(null);
  }

  override onEscape(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Escape') {
      this.closeModal();
    }
  }
}
