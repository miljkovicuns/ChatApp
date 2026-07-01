import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {RegistrationRequest} from '../../models/registration-request';
import {UserService} from '../../services/user-service';
import {AdminService} from '../../services/admin-service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DatePipe, UpperCasePipe} from '@angular/common';
import {User} from '../../models/user';
import {TopBarComponent} from '../top-bar-component/top-bar-component';

@Component({
  selector: 'app-registration-review',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    TopBarComponent
  ],
  templateUrl: './registration-review.html',
  styleUrl: './registration-review.css',
})
export class RegistrationReview implements OnInit{

  private adminService = inject(AdminService)
  private destroyRef = inject(DestroyRef)
  private cdr = inject(ChangeDetectorRef)
  private userService = inject(UserService)

  currentUser: User | null = null;
  requests: RegistrationRequest[]  = []
  isLoading: boolean = false;
  isProcessing: boolean = false;
  actionError: string | null = null;
  selectedRequest: RegistrationRequest | undefined;
  filteredRequests: RegistrationRequest[] = []


  //Stats
   totalRequests: number = 0;
   pendingRequests: number = 0;
   approvedRequests: number = 0;
   rejectedRequests: number = 0;
   todayRequests: number = 0;


  ngOnInit(): void {
    this.loadCurrentUser()
  }

  loadCurrentUser() {
    this.userService.getCurrentUser().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (user: User) => {
        this.currentUser = user;
        this.cdr.detectChanges();
        this.loadAllRequests()
      },
      error: (err) => {
        console.error('Error loading current user:', err);
      }
    });
  }

  loadAllRequests() {
    this.isLoading = true;
    this.adminService.getAllRequests().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (requests: RegistrationRequest[]) => {
        this.requests = requests;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.isLoading = false;
        this.actionError = 'Failed to load registration requests';
      }
    });
  }

  updateStats() {
    this.totalRequests = this.requests.length;
    this.pendingRequests = this.requests.filter(r => r.status == 'pending').length;
    this.approvedRequests = this.requests.filter(r => r.status == 'accepted').length;
    this.rejectedRequests = this.requests.filter(r => r.status == 'rejected').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.todayRequests = this.requests.filter(r => {
      const sentDate = new Date(r.sentAt);
      sentDate.setHours(0, 0, 0, 0);
      return sentDate.getTime() === today.getTime();
    }).length;
  }

  // TODO If I remember and/or if necessary
  // filterRequests() {
  //   if (!this.searchQuery.trim()) {
  //     this.filteredRequests = this.requests;
  //     return;
  //   }
  //
  //   const query = this.searchQuery.toLowerCase().trim();
  //   this.filteredRequests = this.requests.filter(request => {
  //     const fullName = request.user?.fullName?.toLowerCase() || '';
  //     const username = request.user?.username?.toLowerCase() || '';
  //     const email = request.user?.email?.toLowerCase() || '';
  //     return fullName.includes(query) || username.includes(query) || email.includes(query);
  //   });
  // }
  //
  // clearSearch() {
  //   this.searchQuery = '';
  //   this.filterRequests();
  // }

  selectRequest(request: RegistrationRequest) {
    this.selectedRequest = request;
    this.actionError = null;
  }

  approveRequest(request: RegistrationRequest) {
    this.isProcessing = true;
    this.actionError = null;

    this.adminService.approveRequest(request.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (updated: RegistrationRequest) => {
        const index = this.requests.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          this.requests[index] = updated;
        }
        // this.filterRequests();
        this.selectedRequest = updated;
        this.updateStats();
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error approving request:', err);
        this.actionError = 'Failed to approve request';
        this.isProcessing = false;
      }
    });
  }

  rejectRequest(request: RegistrationRequest) {
    this.isProcessing = true;
    this.actionError = null;

    this.adminService.rejectRequest(request.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (updated: RegistrationRequest) => {
        const index = this.requests.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          this.requests[index] = updated;
        }
        // this.filterRequests();
        this.selectedRequest = updated;
        this.updateStats();
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error rejecting request:', err);
        this.actionError = 'Failed to reject request';
        this.isProcessing = false;
      }
    });
  }

  refreshRequests() {
    this.loadAllRequests();
  }

  openSettings() {
    // Navigate to settings or open modal
    console.log('Open settings');
  }

  logout() {
    this.userService.logout();
    // Navigate to login page
  }

  // Top bar custom buttons
  customButtons = [
    {
      id: 'dashboard',
      icon: 'fas fa-home',
      title: 'Dashboard',
      action: () => this.goToDashboard()
    }
  ];

  goToDashboard() {
    // Navigate to dashboard
    console.log('Navigate to dashboard');
  }
}
