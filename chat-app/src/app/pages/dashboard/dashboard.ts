import {ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Auth} from '../../services/auth';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Login} from '../login/login';
import {User} from '../../models/user';
import {ChatService} from '../../services/chat-service';
import {Chat} from '../../models/chat';
import {UserService} from '../../services/user-service';
import {CreateGroupChatRequest} from '../../models/create-group-chat-request';
import {SendMessageRequest} from '../../models/send-message-request';
import {Observable} from 'rxjs';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {UserFilterParams} from '../../models/user-filter-params';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService = inject(Auth);
  private chatService = inject(ChatService)
  private userService = inject(UserService)
  private fb = inject(FormBuilder)
  private destroyRef = inject(DestroyRef)
  private cdr = inject(ChangeDetectorRef)
  private sanitizer = inject(DomSanitizer)

  currentUser: any = null;
  showProfileModal = false;
  showSettingsModal = false;
  showCreateChatModal = false
  isUpdatingProfile = false;
  profileError: string | null = null;

  // Chat-related properties
  selectedChat: Chat | null = null;
  newMessage = '';
  searchQuery = '';
  isLoadingChats = false;
  isLoadingMessages = false;
  isLoadingUsers = false

  createChatStep: 'type' | 'participants' | 'group-details' = 'type';
  selectedChatType: 'direct' | 'group' = 'direct';
  availableUsers: User[] = [];
  selectedParticipants: User[] = [];
  searchUserQuery = '';
  isCreatingChat = false;
  createChatError: string | null = null;

  groupChatForm: FormGroup

  // Data containers (will be populated from API)
  chats: Chat[] = [];
  messages: any[] = [];

  // Profile form
  profileForm: FormGroup;
  selectedImageFile: File | null = null
  profileImagePreview: string | SafeUrl | null = null

  //User filtering during chat creation
  showFilterPanel = false;
  filterByLastSeen: 'all' | 'today' | 'week' | 'month' | 'offline' = 'all';
  filterByHasImage: 'all' | 'hasImage' | 'noImage' = 'all';
  sortBy: 'name' | 'lastSeen' | 'recent' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Settings
  settings = {
    theme: 'light',
    soundNotifications: true,
    desktopNotifications: true,
    sendSound: false,
    showLastSeen: true,
    readReceipts: true,
    allowMessagesFromAnyone: true,
    language: 'en'
  };

  filterParams: UserFilterParams = {
    lastSeen: 'all',
    hasImage: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  };

  private heartbeatInterval: any = null
  private messagePollingInterval: any = null

  constructor() {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      phoneNumber: ['']
    });

    this.groupChatForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    })
  }

  unreadCounts: Map<string, number> = new Map();

  ngOnInit() {
    this.loadCurrentUser()
    this.startHeartbeat()
    this.startMessagePolling();
    this.loadUnreadCounts();
  }

  ngOnDestroy() {
    this.stopHeartbeat()
  }

  startHeartbeat() {
    // Update last seen every minute
    this.heartbeatInterval = setInterval(() => {
      if (this.currentUser) {
        this.userService.updateLastSeen().subscribe({
          next: () => {
            console.log('Heartbeat sent');
          },
          error: (err) => {
            console.error('Heartbeat failed:', err);
          }
        });
      }
    }, 60000); // 60 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getUser()

    if (this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username || '',
        email: this.currentUser.email || '',
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        phoneNumber: this.currentUser.phoneNumber || ''
      });
      this.loadChats()
      this.loadAvailableUsers()

    } else {
      // If getUser is async, try to fetch from API
      this.userService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (user) => {
          this.currentUser = user
          this.authService.saveUser(user)
          this.profileForm.patchValue({
            username: user.username || '',
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phoneNumber: user.phoneNumber || ''
          });
          this.loadChats()
          this.loadAvailableUsers()
        },
        error: (err) => {
          console.error('Error loading current user:', err);
          if (err.status === 401) {
            this.authService.logout();
          }
        }
      });
    }
  }

  getImageUrl(imageString: string | null | undefined): SafeUrl | string {
    if(!imageString) {
      return ''
    }

    if (imageString.startsWith('data:image')) {
      return this.sanitizer.bypassSecurityTrustUrl(imageString);
    }

    // Check if it's base64 without prefix
    if (this.isBase64(imageString)) {
      return this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${imageString}`);
    }

    // Check if it's a regular URL
    if (imageString.startsWith('http://') || imageString.startsWith('https://')) {
      return imageString;
    }

    // If none of the above, return as is (might be base64 without detection)
    return this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${imageString}`);
  }

  isBase64(str: string): boolean {
    try {
      // Check if it looks like base64 (only contains valid base64 chars)
      return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0;
    } catch (err) {
      return false;
    }
  }

  getUserAvatar(user: any): SafeUrl | string {
    if (user?.image) {
      return this.getImageUrl(user.image);
    }
    return ''; // Will show initials
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImagePreview = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string);
        this.profileForm.patchValue({
          image: e.target?.result
        });
      };
      reader.readAsDataURL(file);
    }
  }

  isImageAvatar(avatar: string | SafeUrl): boolean {
    return typeof avatar === 'object' || (typeof avatar === 'string' && avatar.startsWith('data:image'));
  }

  loadChats() {
    console.log("loading chats...")
    this.isLoadingChats = true
    this.chatService.getUserChats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (chats: Chat[]) => {
          this.chats = chats
          this.isLoadingChats = false
          this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Error loading chats:', err)
          this.isLoadingChats = false
        }
      })
  }

  loadMessages(chatId: string) {
    this.isLoadingMessages = true;
    this.chatService.getMessages(chatId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (messages: any[]) => {
          this.messages = messages.map(msg => ({
            ...msg,
            isOwn: msg.sender?.id === this.currentUser?.id,
            dateOfSending: msg.dateOfSending ? new Date(msg.dateOfSending) : null
          }));
          this.isLoadingMessages = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.isLoadingMessages = false;
        }
      });
  }

  loadAvailableUsers() {
    if (!this.currentUser?.id) {
      console.log('Current user not loaded yet, retrying...');
      setTimeout(() => this.loadAvailableUsers(), 500);
      return;
    }

    this.isLoadingUsers = true;

    // Update filter params with search query
    this.filterParams.searchQuery = this.searchUserQuery;

    this.userService.getFilteredUsers(this.filterParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users: User[]) => {
          this.availableUsers = users;
          this.isLoadingUsers = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading users:', err);
          this.isLoadingUsers = false;
        }
      });
  }

  applyFilters() {
    this.loadAvailableUsers();
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
  }

  resetFilters() {
    this.filterParams = {
      lastSeen: 'all',
      hasImage: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    this.searchUserQuery = '';
    this.loadAvailableUsers();
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filterParams.lastSeen && this.filterParams.lastSeen !== 'all') count++;
    if (this.filterParams.hasImage && this.filterParams.hasImage !== 'all') count++;
    if (this.searchUserQuery) count++;
    return count;
  }

  isUserOnline(user: User): boolean {
    return user.online;
  }

  getLastSeenText(user: User): string {
    return user.formattedLastSeen;
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('chat_settings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
      this.applyTheme();
    }
  }

  logout() {
    this.authService.logout();
  }

  openCreateChatModal() {
    this.showCreateChatModal = true;
    this.createChatStep = 'type';
    this.selectedChatType = 'direct';
    this.selectedParticipants = [];
    this.searchUserQuery = '';
    this.createChatError = null;
    this.groupChatForm.reset();
  }

  closeCreateChatModal() {
    this.showCreateChatModal = false;
    this.isCreatingChat = false;
    this.createChatError = null;
  }

  selectChatType(type: 'direct' | 'group') {
    this.selectedChatType = type;
    this.createChatStep = 'participants';
    this.selectedParticipants = [];
    this.createChatError = null;
  }

  toggleParticipantSelection(user: User) {
    const index = this.selectedParticipants.findIndex(p => p.id === user.id);
    if (index === -1) {
      if (this.selectedChatType === 'direct' && this.selectedParticipants.length >= 1) {
        this.createChatError = 'Direct chat can only have one participant';
        return;
      }
      this.selectedParticipants.push(user);
      this.createChatError = null;
    } else {
      this.selectedParticipants.splice(index, 1);
    }
  }

  isParticipantSelected(user: User): boolean {
    return this.selectedParticipants.some(p => p.id === user.id);
  }

  proceedToNextStep() {
    if (this.selectedParticipants.length === 0) {
      this.createChatError = 'Please select at least one participant';
      return;
    }

    if (this.selectedChatType === 'direct') {
      if (this.selectedParticipants.length !== 1) {
        this.createChatError = 'Direct chat requires exactly one participant';
        return;
      }
      this.createDirectChat();
    } else {
      this.createChatStep = 'group-details';
    }
  }

  createDirectChat() {
    this.isCreatingChat = true;
    this.createChatError = null;

    const participantIds = this.selectedParticipants.map(p => p.id);
    participantIds.push(this.currentUser.id);

    this.chatService.createDirectChat(participantIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newChat: Chat) => {
          this.isCreatingChat = false;
          this.chats.unshift(newChat);
          this.cdr.detectChanges();
          this.closeCreateChatModal();
        },
        error: (err) => {
          this.isCreatingChat = false;
          this.createChatError = err.error?.message || 'Failed to create chat';
        }
      });
  }

  getOtherParticipant(chat: Chat) {
    const user = chat.participants.filter(user => user.id !== this.currentUser.id).at(0)
    if(!user) {
      return null
    }
    return user
  }

  createGroupChat() {
    if (this.groupChatForm.invalid) {
      this.groupChatForm.markAllAsTouched();
      return;
    }

    this.isCreatingChat = true;
    this.createChatError = null;

    const participantIds = this.selectedParticipants.map(p => p.id);
    participantIds.push(this.currentUser.id);

    const request: CreateGroupChatRequest = {
      name: this.groupChatForm.get('name')?.value,
      description: this.groupChatForm.get('description')?.value,
      participantIds: participantIds
    };

    this.chatService.createGroupChat(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newChat: Chat) => {
          this.isCreatingChat = false;
          this.chats.unshift(newChat);
          this.closeCreateChatModal();
        },
        error: (err) => {
          this.isCreatingChat = false;
          this.createChatError = err.error?.message || 'Failed to create group chat';
        }
      });
  }

  goBack() {
    if (this.createChatStep === 'participants') {
      this.createChatStep = 'type';
      this.selectedParticipants = [];
    } else if (this.createChatStep === 'group-details') {
      this.createChatStep = 'participants';
    }
  }

  get filteredAvailableUsers() {

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

  getChatDisplayName(chat: Chat): string {
    if (chat.groupChat) {
      return chat.name || 'Group Chat';
    } else {
      const otherParticipant = chat.participants?.find(p => p.id !== this.currentUser?.id);
      return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown User';
    }
  }

  getChatAvatar(chat: Chat): string {
    if (chat.groupChat) {
      return chat.name?.charAt(0)?.toUpperCase() || 'G';
    } else {
      const otherParticipant = chat.participants?.find(p => p.id !== this.currentUser?.id);
      return otherParticipant?.firstName?.charAt(0)?.toUpperCase() || 'U';
    }
  }

  formatLastMessageTime(date: Date): string {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffHours = Math.abs(now.getTime() - messageDate.getTime()) / 36e5;

    if (diffHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  openProfileModal() {
    this.showProfileModal = true;
    this.profileError = null;
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.profileForm.reset();
    this.loadCurrentUser(); // Reset form data
  }

  openSettingsModal() {
    this.showSettingsModal = true;
  }

  closeSettingsModal() {
    this.showSettingsModal = false;
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isUpdatingProfile = true;
    this.profileError = null;

    // TODO: Implement API call to update profile
    // this.authService.updateProfile(this.profileForm.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    //   next: (response) => {
    //     this.isUpdatingProfile = false;
    //     this.currentUser = { ...this.currentUser, ...this.profileForm.value };
    //     this.authService.saveUser(this.currentUser);
    //     this.closeProfileModal();
    //   },
    //   error: (err) => {
    //     this.isUpdatingProfile = false;
    //     this.profileError = err.error?.message || 'Failed to update profile';
    //   }
    // });

    // Temporary simulation - remove when API is implemented
    setTimeout(() => {
      this.isUpdatingProfile = false;
      this.currentUser = { ...this.currentUser, ...this.profileForm.value };
      this.authService.saveUser(this.currentUser);
      this.closeProfileModal();
    }, 1000);
  }

  selectChat(chat: any) {
    this.selectedChat = chat;
    this.loadMessages(chat.id);
    // Mark messages as read
    if (chat.unread > 0) {
      this.markMessagesAsRead(chat.id)
    }
  }

  loadUnreadCounts() {
    this.chatService.getAllUnreadCounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (counts: Map<string, number>) => {
          this.unreadCounts = counts;
          this.chats = this.chats.map(chat => ({
            ...chat,
            unread: this.unreadCounts.get(chat.id) || 0
          }));
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading unread counts:', err);
        }
      });
  }

  markMessagesAsRead(chatId: string) {
    this.chatService.markMessagesAsRead(chatId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Update unread count locally
          this.unreadCounts.set(chatId, 0);
          const chat = this.chats.find(c => c.id === chatId);
          if (chat) {
            chat.unread = 0;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error marking messages as read:', err);
        }
      });
  }

  private checkForNewMessages(chatId: string) {
    if (!this.selectedChat || this.selectedChat.id !== chatId) {
      return;
    }

    this.chatService.getMessages(chatId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (messages: any[]) => {
          // Check for new messages from other users
          if (messages.length > this.messages.length) {
            const newMessages = messages.slice(this.messages.length);
            let hasNewMessage = false;

            newMessages.forEach((msg: any) => {
              const exists = this.messages.some(m => m.id === msg.id);
              if (!exists) {
                this.messages.push({
                  ...msg,
                  isOwn: msg.sender?.id === this.currentUser?.id,
                  content: msg.content || '',
                  dateOfSending: msg.dateOfSending ? new Date(msg.dateOfSending) : null
                });
                hasNewMessage = true;
              }
            });

            if (hasNewMessage) {
              this.cdr.detectChanges();
              if (this.selectedChat) {
                this.markMessagesAsRead(this.selectedChat.id);
              }
            }
          }
        },
        error: (err) => console.error('Error polling messages:', err)
      });
  }

  private startMessagePolling() {
    // This runs every 3 seconds
    this.messagePollingInterval = setInterval(() => {
      if (this.selectedChat) {
        this.checkForNewMessages(this.selectedChat.id);
      }
    }, 3000); // 3 seconds interval
  }

  private stopMessagePolling() {
    if (this.messagePollingInterval) {
      clearInterval(this.messagePollingInterval);
      this.messagePollingInterval = null;
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedChat) return

    const request: SendMessageRequest = {
      content: this.newMessage,
      chatId: this.selectedChat.id,
      senderId: this.currentUser.id
    }

    this.chatService.sendMessage(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.messages.push({
          ...response,
          isOwn: true
        });
        this.newMessage = '';
        this.cdr.detectChanges()
      },
      error: (err) => {
        console.error('Error sending message:', err);
      }
    });
  }

  saveSettings() {
    localStorage.setItem('chat_settings', JSON.stringify(this.settings));
    this.applyTheme();
    this.closeSettingsModal();
  }

  applyTheme() {
    if (this.settings.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  get filteredChats() {
    if (!this.searchQuery) return this.chats;
    return this.chats.filter(chat =>
      chat.name?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  formatTime(date: Date): string {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffHours = Math.abs(now.getTime() - messageDate.getTime()) / 36e5;

    if (diffHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  }
}
