import {ChangeDetectorRef, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {User} from '../../models/user';
import {UserFilterParams} from '../../models/user-filter-params';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-create-chat-modal',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-chat-modal-component.html',
  styleUrl: './create-chat-modal-component.css',
})
export class CreateChatModalComponent {
  @Input() isOpen: boolean = false;
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
  @Output() typeSelected = new EventEmitter<'direct' | 'group'>();
  @Output() back = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<{ type: 'direct' | 'group', participants: User[] }>();
  @Output() submitGroupChat = new EventEmitter<{ formData: any, participants: User[] }>();
  @Output() participantToggled = new EventEmitter<User>();
  @Output() filtersChanged = new EventEmitter<UserFilterParams>();
  @Output() filterPanelToggled = new EventEmitter<void>();
  @Output() filtersReset = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() participantsChanged = new EventEmitter<User[]>();

  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  // Local state
  createChatStep: 'type' | 'participants' | 'group-details' = 'type';
  selectedChatType: 'direct' | 'group' = 'direct';
  selectedParticipants: User[] = [];
  searchUserQuery: string = '';
  showFilterPanel: boolean = false;
  groupChatForm: FormGroup;

  constructor() {
    this.groupChatForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit() {
    // Reset form when modal opens
    this.resetState();
  }

  resetState() {
    this.createChatStep = 'type';
    this.selectedChatType = 'direct';
    this.selectedParticipants = [];
    this.searchUserQuery = '';
    this.showFilterPanel = false;
    this.groupChatForm.reset();
  }

  selectChatType(type: 'direct' | 'group') {
    this.selectedChatType = type;
    this.typeSelected.emit(type);
    this.createChatStep = 'participants';
  }

  goBack() {
    this.back.emit();
    if (this.createChatStep === 'participants') {
      this.createChatStep = 'type';
      this.selectedParticipants = [];
    } else if (this.createChatStep === 'group-details') {
      this.createChatStep = 'participants';
    }
  }

  proceedToNextStep() {
    if (this.selectedParticipants.length === 0) {
      return;
    }

    if (this.selectedChatType === 'direct') {
      if (this.selectedParticipants.length !== 1) {
        return;
      }
      // Emit proceed with participants for direct chat
      this.proceed.emit({
        type: 'direct',
        participants: [...this.selectedParticipants]
      });
    } else {
      // For group chat, move to group details
      this.proceed.emit({
        type: 'group',
        participants: [...this.selectedParticipants]
      });
      this.createChatStep = 'group-details';
    }
  }

  createGroupChat() {
    if (this.groupChatForm.invalid) {
      this.groupChatForm.markAllAsTouched();
      return;
    }

    this.submitGroupChat.emit({
      formData: this.groupChatForm.value,
      participants: [...this.selectedParticipants]
    });
  }

  toggleParticipantSelection(user: User) {
    const index = this.selectedParticipants.findIndex(p => p.id === user.id);
    if (index === -1) {
      if (this.selectedChatType === 'direct' && this.selectedParticipants.length >= 1) {
        // Direct chat can only have one participant - show error
        this.createChatError = 'Direct chat can only have one participant';
        return;
      }
      this.selectedParticipants.push(user);
      this.createChatError = null;
    } else {
      this.selectedParticipants.splice(index, 1);
    }
    // Emit the updated participants list
    this.participantsChanged.emit([...this.selectedParticipants]);
    this.participantToggled.emit(user);
  }

  isParticipantSelected(user: User): boolean {
    return this.selectedParticipants.some(p => p.id === user.id);
  }

  // Filter methods
  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
    this.filterPanelToggled.emit();
  }

  applyFilters() {
    this.filtersChanged.emit(this.filterParams);
  }

  resetFilters() {
    this.filterParams = {
      lastSeen: 'all',
      hasImage: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    this.searchUserQuery = '';
    this.filtersReset.emit();
  }

  onSearchChange() {
    this.searchChanged.emit(this.searchUserQuery);
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filterParams.lastSeen && this.filterParams.lastSeen !== 'all') count++;
    if (this.filterParams.hasImage && this.filterParams.hasImage !== 'all') count++;
    if (this.searchUserQuery) count++;
    return count;
  }

  // Helper methods
  get filteredAvailableUsers(): User[] {
    if (!this.searchUserQuery) return this.availableUsers;

    const filtered = this.availableUsers.filter(user =>
      user.username?.toLowerCase().includes(this.searchUserQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(this.searchUserQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(this.searchUserQuery.toLowerCase()) ||
      user.phoneNumber?.includes(this.searchUserQuery) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(this.searchUserQuery.toLowerCase())
    );
    return filtered;
  }

  getImageUrl(imageString: string | null | undefined): SafeUrl | string {
    if(!imageString) return '';
    if (imageString.startsWith('data:image')) {
      return this.sanitizer.bypassSecurityTrustUrl(imageString);
    }
    if (this.isBase64(imageString)) {
      return this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${imageString}`);
    }
    if (imageString.startsWith('http://') || imageString.startsWith('https://')) {
      return imageString;
    }
    return this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${imageString}`);
  }

  isBase64(str: string): boolean {
    try {
      return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0;
    } catch (err) {
      return false;
    }
  }

  getUserAvatar(user: any): SafeUrl | string {
    if (user?.image) {
      return this.getImageUrl(user.image);
    }
    return '';
  }

  isUserOnline(user: User): boolean {
    return user.online;
  }

  getLastSeenText(user: User): string {
    return user.formattedLastSeen || 'Unknown';
  }

  onClose() {
    this.close.emit();
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }
    return (user.username?.charAt(0) || 'U').toUpperCase();
  }
}
