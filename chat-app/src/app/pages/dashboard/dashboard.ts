import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Auth} from '../../services/auth';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {User} from '../../models/user';
import {ChatService} from '../../services/chat-service';
import {Chat} from '../../models/chat';
import {UserService} from '../../services/user-service';
import {CreateGroupChatRequest} from '../../models/create-group-chat-request';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {UserFilterParams} from '../../models/user-filter-params';
import {WebSocketService} from '../../services/web-socket-service';
import {Message} from '../../models/message';
import {MessageReaction, REACTION_EMOJIS, REACTION_TYPES, ReactionType} from '../../models/reaction';
import {PasswordModalService} from '../../services/modals/password-modal-service';
import {ProfileModalComponent} from '../../modals/profile-modal-component/profile-modal-component';
import {CreateChatModalComponent} from '../../modals/create-chat-modal-component/create-chat-modal-component';
import {Router, RouterLink, ActivatedRoute} from '@angular/router';
import {Page} from '../../models/page';
import {ForwardModal} from '../../modals/forward-modal/forward-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ProfileModalComponent, CreateChatModalComponent, RouterLink, ForwardModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit,OnDestroy {
  private authService = inject(Auth);
  private chatService = inject(ChatService)
  private userService = inject(UserService)
  private fb = inject(FormBuilder)
  private destroyRef = inject(DestroyRef)
  private cdr = inject(ChangeDetectorRef)
  private sanitizer = inject(DomSanitizer)
  private webSocketService = inject(WebSocketService)
  private passwordModalService = inject(PasswordModalService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  //Profile related properties
  currentUser: any = null
  showProfileModal = false
  isUpdatingProfile = false
  profileError: string | null = null
  selectedImageFile: File | null = null
  profileForm: FormGroup;
  profileImagePreview: string | SafeUrl | null = null

  protected pendingRegistrationCount: number = 0

  //Chat creation properties
  showCreateChatModal = false
  createChatStep: 'type' | 'participants' | 'group-details' = 'type';
  selectedChatType: 'direct' | 'group' = 'direct';
  availableUsers: User[] = [];
  selectedParticipants: User[] = [];
  searchUserQuery = '';
  isCreatingChat = false;
  createChatError: string | null = null;
  groupChatForm: FormGroup

  //User filtering during chat creation
  showFilterPanel = false;
  filterByLastSeen: 'all' | 'today' | 'week' | 'month' | 'offline' = 'all';
  filterByHasImage: 'all' | 'hasImage' | 'noImage' = 'all';
  sortBy: 'name' | 'lastSeen' | 'recent' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  showSettingsModal = false
  isLoadingPM = false

  // Chat-related properties
  selectedChat: Chat | null = null;
  newMessage = '';
  searchQuery = '';
  isLoadingChats = false;
  isLoadingMessages = false;
  isLoadingUsers = false



  // Data containers (will be populated from API)
  chats: Chat[] = [];
  messages: Message[] = [];


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

  messageSearchQuery = '';
  isSearchMode = false;
  isSearchingMessages = false;
  searchResults: Message[] = [];
  searchTotalElements = 0;
  searchTotalPages = 0;
  searchCurrentPage = 0;
  private messageSearchSubject = new Subject<string>();
  private readonly SEARCH_DEBOUNCE_TIME = 400; // ms
  showAdvancedSearchFilters = false;
  searchStartDate: string = '';
  searchEndDate: string = '';

  private heartbeatInterval: any = null

  messageStatuses: Map<string, 'sent' | 'delivered' | 'read'> = new Map();

  constructor() {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      phoneNumber: [''],
      image: ['']
    });

    this.groupChatForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    })
  }

  unreadCounts: Map<string, number> = new Map();

  showTypingIndicator = false;
  typingUserId: string | null = null;
  private typingTimeout: any = null;

  reactionPickerMessageId: string | null = null;
  readonly reactionTypes = REACTION_TYPES;
  readonly reactionEmojis = REACTION_EMOJIS;

  ngOnInit() {
    this.loadCurrentUser()
    this.startHeartbeat()
    this.profileImagePreview = this.getUserAvatar(this.currentUser)

    this.webSocketService.connect();

    // Subscribe to WebSocket events
    this.webSocketService.onMessage().subscribe((message: any) => {
      this.handleNewMessage(message);
    });

    this.webSocketService.onUnreadUpdate().subscribe((update: any) => {
      this.handleUnreadUpdate(update);
    });

    this.webSocketService.onTyping().subscribe((typing: any) => {
      this.handleTyping(typing);
    });

    this.webSocketService.onDeliveryUpdate().subscribe((update: any) => {
      this.handleDeliveryUpdate(update);
    });

    // Subscribe to read receipts
    this.webSocketService.onReadReceipt().subscribe((receipt: any) => {
      this.handleReadReceipt(receipt);
    });

    this.webSocketService.onReactionUpdate().subscribe((update: any) => {
      this.handleReactionUpdate(update);
    });

    this.messageSearchSubject.pipe(
      debounceTime(this.SEARCH_DEBOUNCE_TIME),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((searchTerm: string) => {
      this.performMessageSearch(searchTerm);
    });
  }

  ngOnDestroy() {
    this.stopHeartbeat()
    this.webSocketService.unsubscribeFromChat();
    this.webSocketService.disconnect();
  }

  startHeartbeat() {
    // Update last seen every minute
    this.heartbeatInterval = setInterval(() => {
      if (this.currentUser) {
        this.userService.updateLastSeen().subscribe({
          next: () => {
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
          this.userService.updateLastSeen()
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

  selectChatType(type: 'direct' | 'group') {
    this.selectedChatType = type;
    this.createChatStep = 'participants';
    this.selectedParticipants = [];
    this.createChatError = null;
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
        this.cdr.detectChanges()
      };
      reader.readAsDataURL(file);
    }
  }

  isImageAvatar(avatar: string | SafeUrl): boolean {
    return typeof avatar === 'object' || (typeof avatar === 'string' && avatar.startsWith('data:image'));
  }

  loadChats() {
    this.isLoadingChats = true
    this.chatService.getUserChats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (chats: Chat[]) => {
          this.chats = chats
          this.isLoadingChats = false
          this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            const chatId = params['chatId'];
            const messageId = params['messageId'];
            if (chatId && messageId) {
              const chat = this.chats.find(c => c.id == chatId);
              if (chat) {
                this.selectChat(chat);
                // After messages loaded, scroll to that message
                setTimeout(() => this.scrollToMessage(messageId), 500);
              }
            }
            this.clearQueryParams()
          });
          this.cdr.detectChanges()
          this.loadUnreadCounts()
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
          if(messages.length > 0) {
            this.messages = messages.map(msg => ({
              ...msg,
              isOwn: msg.own,
              isSaved: msg.isSaved,
              dateOfSending: msg.dateOfSending ? new Date(msg.dateOfSending) : null,
              status: msg.status || "SENT",
              reactions: msg.reactions || [],
            }));
            console.log(this.messages[0].forwardedFrom)
            this.isLoadingMessages = false;
            this.cdr.detectChanges();
          }else {
            this.messages.length = 0
            this.cdr.detectChanges()
          }
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.isLoadingMessages = false;
        }
      });
  }

  loadAvailableUsers() {
    if (!this.currentUser?.id) {
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

  selectChat(chat: Chat) {
    // ✅ Add null check
    if (!chat || !chat.id) {
      console.warn('Invalid chat selected:', chat);
      return;
    }

    this.webSocketService.unsubscribeFromChat();
    this.selectedChat = chat;
    this.webSocketService.subscribeToChat(chat.id);
    this.loadMessages(chat.id);
    // @ts-ignore
    const unread = this.unreadCounts[chat.id]
    if(unread) {
      chat.unread = unread
    }
    if (chat.unread && chat.unread > 0) {
      this.markMessagesAsRead(chat.id);
    }
    this.exitSearchMode();
  }

  getOtherParticipant(chat: Chat) {
    const user = chat.participants.filter(user => user.id !== this.currentUser.id).at(0)
    if(!user) {
      return null
    }
    return user
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

  openSettingsModal() {
    this.showSettingsModal = true;
  }

  closeSettingsModal() {
    this.showSettingsModal = false;
  }

  detectChanges() {
    this.cdr.detectChanges()
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isUpdatingProfile = true;
    this.profileError = null;

    // TODO: Implement API call to update profile
    this.userService.updateProfile(this.profileForm.value,this.selectedImageFile!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: Map<string,any>) => {
        this.isUpdatingProfile = false;
        this.currentUser = { ...this.currentUser, ...this.profileForm.value };
        // @ts-ignore
        localStorage.setItem("auth_token",response["accessToken"])
        // @ts-ignore
        localStorage.setItem("user",JSON.stringify(response["user"]))
        this.closeProfileModal();
        this.cdr.detectChanges()
      },
      error: (err) => {
        this.isUpdatingProfile = false;
        this.profileError = 'Failed to update profile: ' + err.error?.message;
      }
    });
  }

  loadUnreadCounts() {
    this.chatService.getAllUnreadCounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (counts: Map<string, number>) => {
          let countsMap = new Map<string, number>
          Object.entries(counts).forEach(([key, value]) => {
            countsMap.set(key, Number(value) || 0);
          });
          this.unreadCounts = countsMap;

          this.chats.forEach(chat => {
            const hasCount = this.unreadCounts.has(chat.id);
            const count = this.unreadCounts.get(chat.id) || 0;
          });

          // ✅ Update chats with unread counts
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
              if (this.selectedChat) {
                this.markMessagesAsRead(this.selectedChat.id);
              }
            }
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error polling messages:', err)
      });
  }

  private handleDeliveryUpdate(update: any) {
    if (!update || !update.messageId) return;

    // Find and update the message status
    const message = this.messages.find(m => m.id === update.messageId);
    if (message) {
      message.status = update.status;
      if (update.status === 'DELIVERED') {
        message.deliveredAt = new Date().toISOString();
      }
      this.cdr.detectChanges();
    }
  }

// Handle read receipt
  private handleReadReceipt(receipt: any) {
    if (!receipt || !receipt.chatId) return;

    // Mark all messages in the chat as read (except own)
    const now = new Date().toISOString();
    this.messages.forEach(msg => {
      if (!msg.own && msg.sender?.id !== receipt.userId) {
        msg.status = 'READ';
      }
    });
    this.cdr.detectChanges();
  }

// Helper to check if message is read
  isMessageRead(message: Message): boolean {
    return message.status === "READ";
  }

// Helper to check if message is delivered
  isMessageDelivered(message: Message): boolean {
    return message.status === "DELIVERED";
  }

  sendMessage() {
    if (!this.newMessage?.trim() || !this.selectedChat?.id || !this.currentUser?.id) {
      return;
    }

    // Send with reply ID if replying
    this.webSocketService.sendMessage(
      this.selectedChat.id,
      this.newMessage,
      this.currentUser.id,
      this.replyingToMessageId ?? undefined,
      this.forwardingMessageId ?? undefined
    );
    // Clear the input and reset reply state
    this.newMessage = '';
    this.replyingToMessageId = null;  // ← Clear reply state
    this.forwardingMessageId = null;
    this.cdr.detectChanges();
  }

  onTyping() {
    if (this.selectedChat) {
      this.webSocketService.sendTyping(this.selectedChat.id, true);

      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        if(this.selectedChat==null){
          return
        }
        this.webSocketService.sendTyping(this.selectedChat.id, false);
      }, 3000);
    }
  }

  private handleNewMessage(message: any) {
    if (!message || !message.chatId) {
      console.warn('Invalid message received:', message);
      return;
    }


    if (this.selectedChat && message.chatId === this.selectedChat.id) {
      const exists = this.messages.some(m => m.id === message.id);
      console.log("Sender id: " + message.sender?.id + "Current id:" + this.currentUser.id + " Exists: " + exists)
      if (!exists) {
        this.messages.push({
          ...message,
          own: message.senderId === this.currentUser?.id,
          dateOfSending: message.dateOfSending || new Date().toISOString(),
          status: message.status,
          reactions: message.reactions || [],
        });

        this.cdr.detectChanges();

        // If not own message, mark as delivered and read
        if (message.senderId !== this.currentUser?.id) {
          // Mark chat as read
          this.webSocketService.markAsRead(this.selectedChat.id);
        }
      }
    }

    // Update unread count
    const chat = this.chats.find(c => c.id === message.chatId);
    if (chat && message.senderId !== this.currentUser?.id) {
      if (chat.id !== this.selectedChat?.id) {
        chat.unread = (chat.unread || 0) + 1;
      } else {
        chat.unread = 0;
      }
      this.cdr.detectChanges();
    }
  }

  private handleUnreadUpdate(update: any) {
    if (!update || !update.chatId) {
      console.warn('Invalid unread update received:', update);
      return;
    }

    const chat = this.chats.find(c => c.id === update.chatId);
    if (chat) {
      chat.unread = update.unreadCount || 0;
      this.cdr.detectChanges();
    }
    this.unreadCounts.set(update.chatId, update.unreadCount);
  }

  markMessagesAsRead(chatId: string) {
    // Send WebSocket message to mark as read
    this.webSocketService.markAsRead(chatId);

    // Also call the REST API for persistence
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

  private updateUnreadCount(update: any) {
    const chat = this.chats.find(c => c.id === update.chatId);
    if (chat) {
      chat.unread = update.unreadCount;
      this.cdr.detectChanges();
    }
  }

  private handleTyping(typing: any) {
    // ✅ Add null/undefined check
    if (!typing || !typing.chatId) {
      return;
    }

    if (this.selectedChat && typing.chatId === this.selectedChat.id) {
      this.showTypingIndicator = typing.typing || false;
      this.typingUserId = typing.userId || null;
      this.cdr.detectChanges();
    }
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

  // Modal methods
  //Profile Modal
  openProfileModal() {
    this.showProfileModal = true;
    this.profileError = null;
    this.profileImagePreview = this.getUserAvatar(this.currentUser);
    this.profileForm.patchValue({
      username: this.currentUser?.username || '',
      email: this.currentUser?.email || '',
      firstName: this.currentUser?.firstName || '',
      lastName: this.currentUser?.lastName || '',
      phoneNumber: this.currentUser?.phoneNumber || ''
    });
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.selectedImageFile = null;
  }

  onProfileSave(data: { formData: any, file: File | null }) {
    this.isUpdatingProfile = true;
    this.profileError = null;

    if (data.file) {
      this.selectedImageFile = data.file;
    }

    this.userService.updateProfile(data.formData, this.selectedImageFile!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: Map<string, any>) => {
          this.isUpdatingProfile = false;
          this.currentUser = { ...this.currentUser, ...data.formData };
          // @ts-ignore
          localStorage.setItem('auth_token', response['accessToken']);
          // @ts-ignore
          localStorage.setItem('user', JSON.stringify(response['user']));
          this.closeProfileModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUpdatingProfile = false;
          this.profileError = 'Failed to update profile: ' + err.error?.message;
        }
      });
  }

  onProfileFileSelected(file: File) {
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.profileImagePreview = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  //Change Password Modal
  async changePassword() {
    try {
      const result = await this.passwordModalService.changePassword({
        userId: this.currentUser.id,
        username: this.currentUser.username,
        requiresCurrentPassword: true
      });

      if (result) {
        this.isLoadingPM = true;

        // Fix: Subscribe to the Observable instead of using .toPromise()
        this.userService.changePassword(result).subscribe({
          next: (response) => {
            this.isLoadingPM = false;
            this.showSuccess('Password updated successfully!');
          },
          error: (error) => {
            this.isLoadingPM = false;
            this.showError('Failed to update password. Please try again.');
            console.error('Password update error:', error);
          }
        });
      }
    } catch (error) {
      this.isLoadingPM = false;
      this.showError('Failed to update password. Please try again.');
      console.error('Password update error:', error);
    }
  }

  showSuccess(message: string) {
    // Implement toast/notification
  }

  showError(message: string) {
    // Implement toast/notification
    console.error('Error:', message);
  }

  //Create Chat Modal
  openCreateChatModal() {
    this.showCreateChatModal = true;
    this.createChatStep = 'type';
    this.selectedChatType = 'direct';
    this.selectedParticipants = [];
    this.searchUserQuery = '';
    this.createChatError = null;
    this.groupChatForm.reset();
    this.loadAvailableUsers();
  }

  closeCreateChatModal() {
    this.showCreateChatModal = false;
    this.isCreatingChat = false;
    this.createChatError = null;
  }

  // Event handlers for CreateChatModal
  onChatTypeSelected(type: 'direct' | 'group') {
    this.selectedChatType = type;
    this.selectedParticipants = [];
    this.createChatError = null;
  }

  onChatBack() {
    if (this.createChatStep === 'participants') {
      this.createChatStep = 'type';
      this.selectedParticipants = [];
    } else if (this.createChatStep === 'group-details') {
      this.createChatStep = 'participants';
    }
  }

  onChatProceed(event: { type: 'direct' | 'group', participants: User[] }) {
    this.selectedParticipants = event.participants;

    if (this.selectedParticipants.length === 0) {
      this.createChatError = 'Please select at least one participant';
      return;
    }

    if (event.type === 'direct') {
      if (this.selectedParticipants.length !== 1) {
        this.createChatError = 'Direct chat requires exactly one participant';
        return;
      }
      this.createDirectChat();
    } else {
      this.createChatStep = 'group-details';
    }
  }

  onGroupChatSubmit(event: { formData: any, participants: User[] }) {
    this.selectedParticipants = event.participants;
    if (this.groupChatForm.invalid) {
      this.groupChatForm.markAllAsTouched();
      return;
    }
    this.createGroupChat();
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

  // Update createGroupChat to use selectedParticipants
  createGroupChat() {
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

  onParticipantToggled(user: User) {
    // Logic is handled in the component, we just need to update the parent
    // The selectedParticipants is managed in the child component
  }

  onFiltersChanged(params: UserFilterParams) {
    this.filterParams = params;
    this.loadAvailableUsers();
  }

  onFilterPanelToggled() {
    // Just toggle, handled in child
  }

  onFiltersReset() {
    this.filterParams = {
      lastSeen: 'all',
      hasImage: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    this.searchUserQuery = '';
    this.loadAvailableUsers();
  }

  onSearchChanged(query: string) {
    this.searchUserQuery = query;
    this.loadAvailableUsers();
  }

  protected goToRegistrationReview() {
    this.router.navigate(['/admin/registration-review'])
  }

  toggleReactionPicker(messageId: string, event: Event) {
    event.stopPropagation();
    this.reactionPickerMessageId = this.reactionPickerMessageId === messageId ? null : messageId;
    this.cdr.detectChanges();
  }

  closeReactionPicker() {
    this.reactionPickerMessageId = null;
    this.cdr.detectChanges();
  }

  addReaction(messageId: string, reactionType: ReactionType, event?: Event) {
    event?.stopPropagation();
    if (!this.selectedChat?.id) return;

    this.webSocketService.sendReaction(messageId, this.selectedChat.id, reactionType);
    this.reactionPickerMessageId = null;
    this.cdr.detectChanges();
  }

  getReactionEmoji(type: ReactionType): string {
    return this.reactionEmojis[type] || '👍';
  }

  getGroupedReactions(reactions: MessageReaction[] | undefined): { type: ReactionType; count: number; reacted: boolean }[] {
    if (!reactions?.length) return [];

    const grouped = new Map<ReactionType, { count: number; reacted: boolean }>();
    for (const reaction of reactions) {
      const existing = grouped.get(reaction.reactionType) || { count: 0, reacted: false };
      existing.count++;
      if (reaction.userId === this.currentUser?.id) {
        existing.reacted = true;
      }
      grouped.set(reaction.reactionType, existing);
    }

    return Array.from(grouped.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      reacted: data.reacted
    }));
  }

  private handleReactionUpdate(update: any) {
    if (!update?.messageId || !update.reactions) return;

    const message = this.messages.find(m => m.id === update.messageId);
    if (message) {
      message.reactions = update.reactions;
      this.cdr.detectChanges();
    }
  }

  performMessageSearch(keyword: string) {
    if (!this.selectedChat?.id) {
      return;
    }

    const trimmedKeyword = keyword?.trim();

    if (!trimmedKeyword) {
      this.exitSearchMode();
      return;
    }

    this.isSearchingMessages = true;
    this.isSearchMode = true;

    // ✅ Use the date values – if empty, pass undefined (backend ignores them)
    this.chatService.searchMessages(
      this.selectedChat.id,
      trimmedKeyword,
      this.searchStartDate || undefined,
      this.searchEndDate || undefined,
      0,
      50
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page: Page<Message>) => {
          this.searchResults = page.content.map(msg => ({
            ...msg,
            own: msg.senderId === this.currentUser?.id,
            dateOfSending: msg.dateOfSending || ''
          }));
          this.searchTotalElements = page.totalElements;
          this.searchTotalPages = page.totalPages;
          this.searchCurrentPage = page.number;
          this.isSearchingMessages = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error searching messages:', err);
          this.isSearchingMessages = false;
          this.searchResults = [];
          this.cdr.detectChanges();
        }
      });
  }

  onMessageSearchInput(searchTerm: string) {
    this.messageSearchQuery = searchTerm;
    this.messageSearchSubject.next(searchTerm);
  }

// Exit search mode and show normal messages
  exitSearchMode() {
    this.isSearchMode = false;
    this.messageSearchQuery = '';
    this.searchResults = [];
    this.isSearchingMessages = false;
    this.cdr.detectChanges();
  }

// Load more search results (infinite scroll or "Load More" button)
  loadMoreSearchResults() {
    if (!this.selectedChat?.id || !this.messageSearchQuery.trim()) {
      return;
    }

    const nextPage = this.searchCurrentPage + 1;
    if (nextPage >= this.searchTotalPages) {
      return;
    }

    this.isSearchingMessages = true;

    this.chatService.searchMessages(
      this.selectedChat.id,
      this.messageSearchQuery.trim(),
      this.searchStartDate || undefined,  // ✅ Use the dates
      this.searchEndDate || undefined,    // ✅ Use the dates
      nextPage,
      50
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page: Page<Message>) => {
          const newMessages = page.content.map(msg => ({
            ...msg,
            own: msg.senderId === this.currentUser?.id,
            dateOfSending: msg.dateOfSending || ''
          }));
          this.searchResults = [...this.searchResults, ...newMessages];
          this.searchTotalElements = page.totalElements;
          this.searchTotalPages = page.totalPages;
          this.searchCurrentPage = page.number;
          this.isSearchingMessages = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading more search results:', err);
          this.isSearchingMessages = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Highlight search keyword in message content
  highlightText(text: string, searchTerm: string): string {
    if (!text || !searchTerm || !searchTerm.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  get currentMessages(): Message[] {
    return this.isSearchMode ? this.searchResults : this.messages;
  }

  clearDateFilters() {
    this.searchStartDate = '';
    this.searchEndDate = '';
    // Re-run the search to refresh results without date filters
    if (this.messageSearchQuery.trim()) {
      this.performMessageSearch(this.messageSearchQuery);
    }
  }

  // Add to Dashboard component

  toggleSaveMessage(messageId: string, event: Event) {
    event.stopPropagation();
    const message = this.currentMessages.find(m => m.id === messageId);
    if (!message) return;

    if (message.isSaved) {
      this.unsaveMessage(messageId);
    } else {
      this.saveMessage(messageId);
    }
  }

  saveMessage(messageId: string) {
    this.chatService.saveMessage(messageId).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const msg = this.currentMessages.find(m => m.id === messageId);
          if (msg) msg.isSaved = true;
          this.cdr.detectChanges();
        },
        error: (err) => alert("Message already saved")
      });
  }

  unsaveMessage(messageId: string) {
    this.chatService.unsaveMessage(messageId).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const msg = this.currentMessages.find(m => m.id === messageId);
          if (msg) msg.isSaved = false;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error unsaving message', err)
      });
  }

  scrollToMessage(messageId: string) {
  const element = document.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 3000);
    }
  }

  clearQueryParams() {
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true // Replaces the current history state instead of adding a new one
    });
  }

  goToUserManagement() {
    this.router.navigate(['/admin/user-management']);
  }

  goToAnalytics() {
    this.router.navigate(['/admin/analytics']);
  }

  replyingToMessageId: string | undefined | null;

  startReply(messageId: string) {
    this.replyingToMessageId = messageId;
    // Focus the input after a short delay
    setTimeout(() => {
      const input = document.querySelector('.message-input-area input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  /**
   * Cancel the current reply
   */
  cancelReply() {
    this.replyingToMessageId = null;
  }

  /**
   * Get a preview of the message being replied to
   */
  getReplyPreview(): string {
    const msg = this.messages.find(m => m.id === this.replyingToMessageId);
    if (!msg) return '';
    const content = msg.content || '';
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  }

  // Forward state
  forwardingMessageId: string | null = null;
  showForwardModal = false;

  startForward(messageId: string) {
    this.forwardingMessageId = messageId;
    this.showForwardModal = true;
  }

  handleForward(event: { chatId: string; messageId: string }) {
    // Forward the message
    const originalMsg = this.messages.find(m => m.id === event.messageId);
    if (!originalMsg || !this.currentUser?.id) return;

    this.webSocketService.sendMessage(
      event.chatId,
      originalMsg.content,
      this.currentUser.id,
      undefined,
      event.messageId
    );
  }

  closeForwardModal() {
    this.showForwardModal = false;
    this.forwardingMessageId = null;
  }
}
