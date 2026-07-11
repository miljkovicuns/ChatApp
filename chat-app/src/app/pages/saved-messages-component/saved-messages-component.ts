import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat-service';
import { SavedMessageDto } from '../../models/saved-message.dto';
import { Page } from '../../models/page';

@Component({
  selector: 'app-saved-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved-messages-component.html',
  styleUrls: ['./saved-messages-component.css']
})
export class SavedMessagesComponent implements OnInit {
  private chatService = inject(ChatService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef)

  savedMessages: SavedMessageDto[] = [];
  isLoading = false;
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  hasMore = false;

  ngOnInit() {
    this.loadSavedMessages();
  }

  loadSavedMessages() {
    this.isLoading = true;
    this.chatService.getSavedMessages(this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page: Page<SavedMessageDto>) => {
          console.log(page)
          this.savedMessages = page.content;
          console.log(this.savedMessages)
          this.totalPages = page.totalPages;
          this.hasMore = this.currentPage < this.totalPages - 1;
          this.isLoading = false;
          this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Error loading saved messages', err);
          this.isLoading = false;
        }
      });
  }

  loadMore() {
    if (!this.hasMore) return;
    this.currentPage++;
    this.isLoading = true;
    this.chatService.getSavedMessages(this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page: Page<SavedMessageDto>) => {
          this.savedMessages = [...this.savedMessages, ...page.content];
          this.totalPages = page.totalPages;
          this.hasMore = this.currentPage < this.totalPages - 1;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading more saved messages', err);
          this.isLoading = false;
        }
      });
  }

  openChat(chatId: string, messageId: string) {
    // Navigate to dashboard with chatId and optional messageId highlight
    this.router.navigate(['/dashboard'], {
      queryParams: { chatId, messageId }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
