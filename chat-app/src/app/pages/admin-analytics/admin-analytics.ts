import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user-service';
import { AdminService } from '../../services/admin-service';
import { User } from '../../models/user';
import { TopBarComponent } from '../top-bar-component/top-bar-component';
import { AnalyticsSummaryDto } from '../../models/analytics-summary.dto';
import {AnalyticsTimeSeriesDto} from '../../models/analytics-time-series-dto';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, TopBarComponent],
  templateUrl: './admin-analytics.html',
  styleUrls: ['./admin-analytics.css']
})
export class AdminAnalytics implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(Auth);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef)

  currentUser: User | null = null;
  analytics: AnalyticsSummaryDto | null = null;
  isLoading = false;
  error: string | null = null;

  // Date range
  startDate: string = '';
  endDate: string = '';

  // Aggregation level (daily/weekly/monthly/yearly) – we'll use it for grouping later,
  // but for now we just fetch raw data; we can later add grouping logic on frontend/backend.
  aggregationLevel: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';

  // Custom buttons for top bar
  customButtons = [
    { id: 'dashboard', icon: '⬅️', title: 'Dashboard', action: () => this.goToDashboard() }
  ];

  ngOnInit(): void {
    this.loadCurrentUser();
    // Set default dates: last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    this.startDate = this.formatDateForInput(thirtyDaysAgo);
    this.endDate = this.formatDateForInput(now);
    this.loadAnalytics();
  }

  loadCurrentUser() {
    // Assuming you have a method to get current user
    this.currentUser = this.authService.getUser(); // adjust
    if (!this.currentUser) {
      this.authService.logout();
      return;
    }
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  }

  loadAnalytics() {
    if (!this.startDate || !this.endDate) {
      this.error = 'Please select both start and end dates.';
      return;
    }
    this.isLoading = true;
    this.error = null;
    // Convert dates to ISO strings (backend expects ISO-8601)
    const start = new Date(this.startDate).toISOString();
    const end = new Date(this.endDate).toISOString();

    this.adminService.getAnalytics(start, end)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.analytics = data;
          this.isLoading = false;

          this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Error loading analytics:', err);
          this.error = 'Failed to load analytics data.';
          this.isLoading = false;
        }
      });
    this.loadTimeSeries();
  }

  onDateChange() {
    // Auto-refresh when dates change
    this.loadAnalytics();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
  }

  openSettings() {
    // optional
  }

  timeSeriesData: AnalyticsTimeSeriesDto[] = [];

  loadTimeSeries() {
    // use aggregationLevel from dropdown
    this.adminService.getTimeSeriesAnalytics(
      new Date(this.startDate).toISOString(),
      new Date(this.endDate).toISOString(),
      this.aggregationLevel
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.timeSeriesData = data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading time series:', err)
      });
  }
}
