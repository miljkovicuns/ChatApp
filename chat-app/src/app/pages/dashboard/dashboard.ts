import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Auth} from '../../services/auth';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Login} from '../login/login';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService = inject(Auth);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  currentUser: any = null;
  showProfileModal = false;
  showSettingsModal = false;
  isUpdatingProfile = false;
  profileError: string | null = null;

  // Chat-related properties
  selectedChat: any = null;
  newMessage = '';
  searchQuery = '';

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
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadChats();
    this.loadSettings();
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username || '',
        email: this.currentUser.email || '',
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        phoneNumber: this.currentUser.phoneNumber || ''
      });
    }
  }

  loadChats() {
    // TODO: Implement API call to load chats
    // this.authService.getChats().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    //   next: (response) => {
    //     this.chats = response;
    //   },
    //   error: (err) => {
    //     console.error('Error loading chats:', err);
    //   }
    // });
  }

  loadMessages(chatId: number) {
    // TODO: Implement API call to load messages for selected chat
    // this.authService.getMessages(chatId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    //   next: (response) => {
    //     this.messages = response;
    //   },
    //   error: (err) => {
    //     console.error('Error loading messages:', err);
    //   }
    // });
  }

  loadSettings() {
    // TODO: Implement API call to load user settings
    const savedSettings = localStorage.getItem('chat_settings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
      this.applyTheme();
    }
  }

  logout() {
    this.authService.logout();
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
    if (!this.newMessage.trim() || !this.selectedChat) return;

    const message = {
      id: Date.now(),
      senderId: this.currentUser?.id,
      receiverId: this.selectedChat.id,
      content: this.newMessage,
      timestamp: new Date(),
      isOwn: true
    };

    // TODO: Implement API call to send message
    // this.authService.sendMessage(this.selectedChat.id, this.newMessage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    //   next: (response) => {
    //     this.messages.push(response);
    //     this.newMessage = '';
    //   },
    //   error: (err) => {
    //     console.error('Error sending message:', err);
    //   }
    // });

    // Temporary local update - remove when API is implemented
    this.messages.push(message);
    this.newMessage = '';
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
