import {ChangeDetectorRef, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {Chat} from '../../models/chat';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {User} from '../../models/user';
import {ChatService} from '../../services/chat-service';
import {UpperCasePipe} from '@angular/common';

@Component({
  selector: 'app-forward-modal',
  imports: [
    UpperCasePipe
  ],
  templateUrl: './forward-modal.html',
  styleUrl: './forward-modal.css',
})
export class ForwardModal {
  @Input() isOpen = false;
  @Input() messageId: string | null = null;
  @Input() currentUserId: string | null = null;
  @Input() currentChatId: string | null = null;
  @Input() chats: Chat[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() forward = new EventEmitter<{ chatId: string; messageId: string }>();

  private chatService = inject(ChatService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  availableChats: Chat[] = [];
  isLoading = false;

  ngOnInit() {
    // No auto-load – we load when modal opens
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.loadAvailableChats();
    }
  }

  loadAvailableChats() {
    this.isLoading = true;
    // Filter out the current chat
    this.availableChats = this.chats.filter(c => c.id !== this.currentChatId);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.close.emit();
  }

  forwardToChat(chatId: string) {
    if (!this.messageId) return;
    this.forward.emit({ chatId, messageId: this.messageId });
    this.closeModal();
  }

  getChatDisplayName(chat: Chat): string {
    if (chat.groupChat) {
      return chat.name || 'Group Chat';
    } else {
      const otherParticipant = chat.participants?.find(p => p.id !== this.currentUserId);
      return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown User';
    }
  }

  getOtherParticipant(chat: Chat): User | null {
    if (!this.currentUserId) return null;
    const user = chat.participants?.filter(u => u.id !== this.currentUserId).at(0);
    return user || null;
  }

  getChatAvatar(chat: Chat): string {
    return this.getChatDisplayName(chat).charAt(0).toUpperCase();
  }

  getUserAvatar(user: User | null): SafeUrl | string {
    if (!user?.profileImage) return '';
    return this.sanitizer.bypassSecurityTrustUrl(user.profileImage);
  }

  // Helper for unique tracking
  trackByChatId(index: number, chat: Chat): string {
    return chat.id;
  }
}
