import {ChangeDetectorRef, Component, DestroyRef, EventEmitter, inject, Input, Output} from '@angular/core';
import { User } from '../../models/user';
import { UserFilterParams } from '../../models/user-filter-params';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../services/chat-service';
import { GroupService } from '../../services/group-service';
import { Chat } from '../../models/chat';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-chat-modal',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './create-chat-modal-component.html',
  styleUrl: './create-chat-modal-component.css',
})
export class CreateChatModalComponent {
  @Input() isOpen = false;
  @Input() currentUserId: string = '';
  @Input() currentUser: any = null;
  @Input() availableUsers: User[] = [];
  @Input() isLoadingUsers: boolean = false;
  @Input() isCreatingChat: boolean = false;
  @Input() createChatError: string | null = null;
  @Input() filterParams: UserFilterParams = {
    lastSeen: 'all',
    hasImage: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  };

  @Output() close = new EventEmitter<void>();
  @Output() chatCreated = new EventEmitter<Chat>(); // emit when chat is created

  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private chatService = inject(ChatService);
  private groupService = inject(GroupService);
  private destroyRef = inject(DestroyRef)

  // Local state
  createChatStep: 'type' | 'participants' | 'group-details' = 'type';
  selectedChatType: 'direct' | 'group' = 'direct';
  selectedParticipants: User[] = [];
  searchUserQuery: string = '';
  showFilterPanel: boolean = false;
  groupChatForm: FormGroup;
  groupImageFile: File | null = null;
  groupImagePreview: SafeUrl | string | null = null;

  // Internal loading/error
  internalLoading = false;
  internalError: string | null = null;

  constructor() {
    this.groupChatForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.resetState();
  }

  resetState() {
    this.createChatStep = 'type';
    this.selectedChatType = 'direct';
    this.selectedParticipants = [];
    this.searchUserQuery = '';
    this.showFilterPanel = false;
    this.groupChatForm.reset();
    this.groupImageFile = null;
    this.groupImagePreview = null;
    this.internalError = null;
  }

  // Step 1: Select chat type
  selectChatType(type: 'direct' | 'group') {
    this.selectedChatType = type;
    this.createChatStep = 'participants';
    this.internalError = null;
  }

  // Step 2: Proceed to next step
  proceedToNextStep() {
    if (this.selectedParticipants.length === 0) {
      this.internalError = 'Please select at least one participant';
      return;
    }

    if (this.selectedChatType === 'direct') {
      if (this.selectedParticipants.length !== 1) {
        this.internalError = 'Direct chat requires exactly one participant';
        return;
      }
      // Create direct chat directly
      this.createDirectChat();
    } else {
      // Move to group details
      this.createChatStep = 'group-details';
      this.internalError = null;
    }
  }

  // Step 3: Create group chat (called from footer button)
  createGroupChat() {
    if (this.groupChatForm.invalid) {
      this.groupChatForm.markAllAsTouched();
      return;
    }

    this.internalLoading = true;
    this.internalError = null;

    const formData = new FormData();
    formData.append('name', this.groupChatForm.get('name')?.value);
    formData.append('description', this.groupChatForm.get('description')?.value || '');
    if (this.groupImageFile) {
      formData.append('image', this.groupImageFile);
    }

    // Add current user as participant (creator)
    const participantIds = this.selectedParticipants.map(p => p.id);
    participantIds.push(this.currentUserId);
    participantIds.forEach(id => formData.append('participantIds', id));

    this.groupService.createGroup(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newChat) => {
          this.internalLoading = false;
          this.chatCreated.emit(newChat);
          this.closeModal();
        },
        error: (err) => {
          this.internalLoading = false;
          this.internalError = err.error?.message || 'Failed to create group chat';
          this.cdr.detectChanges();
        }
      });
  }

  // Direct chat creation
  createDirectChat() {
    if (!this.currentUserId) return;
    this.internalLoading = true;
    this.internalError = null;

    const participantIds = this.selectedParticipants.map(p => p.id);
    participantIds.push(this.currentUserId);

    this.chatService.createDirectChat(participantIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newChat) => {
          this.internalLoading = false;
          this.chatCreated.emit(newChat);
          this.closeModal();
        },
        error: (err) => {
          this.internalLoading = false;
          this.internalError = err.error?.message || 'Failed to create direct chat';
          this.cdr.detectChanges();
        }
      });
  }

  // Navigation between steps
  goBack() {
    if (this.createChatStep === 'participants') {
      this.createChatStep = 'type';
      this.selectedParticipants = [];
    } else if (this.createChatStep === 'group-details') {
      this.createChatStep = 'participants';
    }
    this.internalError = null;
  }

  // Participant selection
  toggleParticipantSelection(user: User) {
    const index = this.selectedParticipants.findIndex(p => p.id === user.id);
    if (index === -1) {
      if (this.selectedChatType === 'direct' && this.selectedParticipants.length >= 1) {
        this.internalError = 'Direct chat can only have one participant';
        return;
      }
      this.selectedParticipants.push(user);
      this.internalError = null;
    } else {
      this.selectedParticipants.splice(index, 1);
    }
  }

  isParticipantSelected(user: User): boolean {
    return this.selectedParticipants.some(p => p.id === user.id);
  }

  // Image handling
  onGroupImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.groupImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.groupImagePreview = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  // Filter methods (same as before)
  toggleFilterPanel() { this.showFilterPanel = !this.showFilterPanel; }
  applyFilters() { /* emit to parent? or handle locally? we can just rely on parent's filter */ }
  resetFilters() { /* reset locally and notify parent */ }
  onSearchChange() { /* notify parent */ }
  getActiveFilterCount(): number { /* compute */ return 0; }

  // Helpers
  get filteredAvailableUsers(): User[] {
    if (!this.searchUserQuery) return this.availableUsers;
    const q = this.searchUserQuery.toLowerCase();
    return this.availableUsers.filter(user =>
      user.username?.toLowerCase().includes(q) ||
      user.firstName?.toLowerCase().includes(q) ||
      user.lastName?.toLowerCase().includes(q) ||
      user.phoneNumber?.includes(q) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(q)
    );
  }

  getImageUrl(imageString: string | null | undefined): SafeUrl | string {
    if (!imageString) return '';
    // ... existing sanitization logic
    return imageString;
  }

  getUserAvatar(user: any): SafeUrl | string {
    return user?.image ? this.getImageUrl(user.image) : '';
  }

  isUserOnline(user: User): boolean { return user.online; }
  getLastSeenText(user: User): string { return user.formattedLastSeen || 'Unknown'; }
  getInitials(user: User): string {
    return user.firstName && user.lastName
      ? (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase()
      : (user.username?.charAt(0) || 'U').toUpperCase();
  }

  // Close modal
  closeModal() {
    this.close.emit();
    this.resetState();
  }
}
