import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
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

  currentUser: any = null;
  showProfileModal = false;
  showSettingsModal = false;
  showCreateChatModal = false
  isUpdatingProfile = false;
  profileError: string | null = null;

  // Chat-related properties
  selectedChat: any = null;
  newMessage = '';
  searchQuery = '';
  isLoadingChats = false;
  isLoadingMessages = false;

  createChatStep: 'type' | 'participants' | 'group-details' = 'type';
  selectedChatType: 'direct' | 'group' = 'direct';
  availableUsers: User[] = [];
  selectedParticipants: User[] = [];
  searchUserQuery = '';
  isCreatingChat = false;
  createChatError: string | null = null;

  groupChatForm: FormGroup

  // Data containers (will be populated from API)
  chats: any[] = [];
  messages: any[] = [];

  // Profile form
  profileForm: FormGroup;

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

  ngOnInit() {
    this.loadCurrentUser();
    this.loadAvailableUsers()
  }

  loadCurrentUser() {
    // If getUser() returns a Promise or Observable, handle it properly
    this.currentUser = this.authService.getUser();

    if (this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username || '',
        email: this.currentUser.email || '',
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        phoneNumber: this.currentUser.phoneNumber || ''
      });

      // Load chats and users AFTER currentUser is set
      this.loadChats();
      this.loadAvailableUsers();
    } else {
      // If getUser is async, try to fetch from API
      this.userService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.authService.saveUser(user);
          this.profileForm.patchValue({
            username: user.username || '',
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phoneNumber: user.phoneNumber || ''
          });

          // Load chats and users after currentUser is loaded
          this.loadChats();
          this.loadAvailableUsers();
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

  loadChats() {
    this.isLoadingChats = true
    this.chatService.getUserChats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (chats: Chat[]) => {
          this.chats = chats
          this.isLoadingChats = false
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
          }))
          this.isLoadingMessages = false
        },
        error: (err) => {
          console.error('Error loading messages:', err)
          this.isLoadingMessages = false
        }
      })
  }

  loadAvailableUsers() {
    // Make sure currentUser exists before filtering
    if (!this.currentUser?.id) {
      console.log('Current user not loaded yet, retrying...');
      // Retry after a short delay
      setTimeout(() => this.loadAvailableUsers(), 500);
      return;
    }

    this.userService.getAllUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users: User[]) => {
          console.log('All users received:', users);
          console.log('Current user:', this.currentUser);
          this.availableUsers = users.filter(user => user.id !== this.currentUser?.id);
          console.log('Available users after filter:', this.availableUsers);
        },
        error: (err) => {
          console.error('Error loading users:', err);
        }
      });
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
          this.closeCreateChatModal();
        },
        error: (err) => {
          this.isCreatingChat = false;
          this.createChatError = err.error?.message || 'Failed to create chat';
        }
      });
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
    console.log('Search query:', this.searchUserQuery);
    console.log('Available users:', this.availableUsers);

    if (!this.searchUserQuery) return this.availableUsers;

    const filtered = this.availableUsers.filter(user =>
      user.username?.toLowerCase().includes(this.searchUserQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(this.searchUserQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(this.searchUserQuery.toLowerCase()) ||
      user.phoneNumber?.includes(this.searchUserQuery) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(this.searchUserQuery.toLowerCase())
    );

    console.log('Filtered users:', filtered);
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
      // TODO: API call to mark messages as read
      chat.unread = 0;
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
      next: (message) => {
        this.messages.push({
          ...message,
          isOwn: true
        })
        this.newMessage = '';
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
