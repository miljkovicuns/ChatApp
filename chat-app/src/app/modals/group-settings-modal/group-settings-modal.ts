import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef, DestroyRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chat } from '../../models/chat';
import { GroupMemberDto } from '../../models/group-member.dto';
import { GroupService } from '../../services/group-service';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-group-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-settings-modal.html',  // ✅ fixed filename
  styleUrls: ['./group-settings-modal.css']
})
export class GroupSettingsModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() chat: Chat | null = null;
  @Input() currentUserId: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() groupUpdated = new EventEmitter<Chat>();

  private groupService = inject(GroupService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  members: GroupMemberDto[] = [];
  isLoading = false;
  error: string | null = null;

  // Edit group details
  editName = '';
  editDescription = '';
  editImageFile: File | null = null;
  editImagePreview: SafeUrl | string | null = null;

  // Add member
  searchUserQuery = '';
  availableUsers: User[] = [];
  selectedUsers: User[] = [];
  isLoadingUsers = false;
  searchError: string | null = null;

  // Invite link
  inviteLink: string | null = null;
  generatingLink = false;

  // Self role
  selfRole: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen && this.chat) {
      this.loadMembers();
      this.editName = this.chat.name || '';
      this.editDescription = this.chat.description || '';
      // if chat.image is a base64 string without prefix, add it; if it already has prefix, use directly
      if (this.chat.image) {
        if (this.chat.image.startsWith('data:image')) {
          this.editImagePreview = this.sanitizer.bypassSecurityTrustUrl(this.chat.image);
        } else {
          this.editImagePreview = this.sanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + this.chat.image);
        }
      } else {
        this.editImagePreview = null;
      }
      this.inviteLink = null;
      this.selectedUsers = [];
      this.availableUsers = [];
      this.searchUserQuery = '';
    }
  }

  loadSelfRole() {
    if (!this.currentUserId) return;
    this.selfRole = this.members.find(m => m.userId === this.currentUserId)?.role || null;
  }

  loadMembers() {
    if (!this.chat) return;
    this.isLoading = true;
    this.groupService.getMembers(this.chat.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (members) => {
          this.members = members;
          this.isLoading = false;
          this.loadSelfRole();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load members';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  // Edit group
  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.editImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.editImagePreview = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  saveGroupDetails() {
    if (!this.chat) return;
    const formData = new FormData();
    if (this.editName) formData.append('name', this.editName);
    if (this.editDescription) formData.append('description', this.editDescription);
    if (this.editImageFile) formData.append('image', this.editImageFile);

    this.isLoading = true;
    this.error = null;
    this.groupService.updateGroup(this.chat.id, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.chat = updated;
          this.groupUpdated.emit(updated);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to update group';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  // Member management
  removeMember(userId: string) {
    if (!this.chat) return;
    if (userId === this.currentUserId) return;
    if (!confirm('Remove this member?')) return;
    this.isLoading = true;
    this.error = null;
    this.groupService.removeMember(this.chat.id, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.chat = updated;
          this.loadMembers();
          this.groupUpdated.emit(updated);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to remove member';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  updateRole(userId: string, role: string) {
    if (!this.chat) return;
    if (userId === this.currentUserId) return;
    this.isLoading = true;
    this.error = null;
    this.groupService.updateMemberRole(this.chat.id, userId, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadMembers();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to update role';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  // Add members
  searchUsers() {
    if (!this.searchUserQuery.trim()) {
      this.availableUsers = [];
      return;
    }
    this.isLoadingUsers = true;
    this.searchError = null;
    this.userService.getFilteredUsers({ searchQuery: this.searchUserQuery, size: 20 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          const memberIds = this.members.map(m => m.userId);
          this.availableUsers = users.filter(u => !memberIds.includes(u.id) && u.id !== this.currentUserId);
          this.isLoadingUsers = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.searchError = 'Failed to search users';
          this.isLoadingUsers = false;
          console.error(err);
        }
      });
  }

  toggleUserSelection(user: User) {
    const idx = this.selectedUsers.findIndex(u => u.id === user.id);
    if (idx > -1) this.selectedUsers.splice(idx, 1);
    else this.selectedUsers.push(user);
  }

  isUserSelected(user: User): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  addSelectedMembers() {
    if (!this.chat || this.selectedUsers.length === 0) return;
    const userIds = this.selectedUsers.map(u => u.id);
    this.isLoading = true;
    this.error = null;
    this.groupService.addMembers(this.chat.id, userIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.chat = updated;
          this.loadMembers();
          this.groupUpdated.emit(updated);
          this.selectedUsers = [];
          this.searchUserQuery = '';
          this.availableUsers = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to add members';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  // Invite link
  generateInviteLink() {
    if (!this.chat) return;
    this.generatingLink = true;
    this.error = null;
    this.groupService.generateInvite(this.chat.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.inviteLink = window.location.origin + res.link;
          this.generatingLink = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to generate invite link';
          this.generatingLink = false;
          console.error(err);
        }
      });
  }

  copyInviteLink() {
    if (this.inviteLink) {
      navigator.clipboard.writeText(this.inviteLink).then(() => {
        alert('Link copied to clipboard');
      });
    }
  }

  closeModal() {
    this.close.emit();
  }
}
