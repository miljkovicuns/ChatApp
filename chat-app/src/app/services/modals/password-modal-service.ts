import {Injectable, Service} from '@angular/core';
import {BaseModalService} from './base-modal-service';
import {PasswordModalComponent} from '../../modals/password-modal-component/password-modal-component';

export interface PasswordModalData {
  userId: string;
  username?: string;
  requiresCurrentPassword?: boolean;
}

export interface PasswordModalResult {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordModalService extends BaseModalService{
  getModalComponent() {
    return PasswordModalComponent;
  }

  /**
   * Open password change modal
   * @param data - Modal configuration data
   * @returns Promise with password data or null if cancelled
   */
  async changePassword(data: PasswordModalData): Promise<any> {
    try {
      const result: PasswordModalResult = await this.open({
        userId: data.userId,
        username: data.username || '',
        requiresCurrentPassword: data.requiresCurrentPassword !== false
      });

      // Return the password data
      if (result) {
        return {
          userId: result.userId,
          currentPassword: result.currentPassword,
          newPassword: result.newPassword
        };
      }
      return null;
    } catch (error) {
      console.error('Password modal error:', error);
      return null;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    message: string;
    requirements: string[];
  } {
    const requirements = [];
    let score = 0;

    if (password.length >= 8) {
      score++;
    } else {
      requirements.push('At least 8 characters');
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      requirements.push('At least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score++;
    } else {
      requirements.push('At least one lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      score++;
    } else {
      requirements.push('At least one number');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score++;
    } else {
      requirements.push('At least one special character');
    }

    const valid = requirements.length === 0;
    const messages = [
      'Very Weak',
      'Weak',
      'Fair',
      'Good',
      'Strong',
      'Very Strong'
    ];

    return {
      valid,
      score,
      message: messages[score],
      requirements
    };
  }
}
