import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user-service';
import { AdminService } from '../../services/admin-service';
import { User } from '../../models/user';
import { TopBarComponent } from '../top-bar-component/top-bar-component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    UpperCasePipe,
    TopBarComponent
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagement implements OnInit {
  private userService = inject(UserService);
  private adminService = inject(AdminService);
  private authService = inject(Auth);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  isLoading = false;
  isProcessing = false;
  actionError: string | null = null;

  // Search / filter
  searchQuery = '';

  // Stats
  totalUsers = 0;
  onlineUsers = 0;
  adminUsers = 0;
  activeUsers = 0; // if we have an 'active' flag, else just count all

  // Role options
  roles = ['USER', 'ADMIN']; // adjust as needed

  // Custom buttons for top bar
  customButtons = [
    {
      id: 'dashboard',
      icon: '⬅️',
      title: 'Dashboard',
      action: () => this.goToDashboard()
    }
  ];

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.userService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error loading current user:', err);
          if (err.status === 401) this.authService.logout();
        }
      });
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getFilteredUsers({size: 100}) // fetch all for now
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.applyFilters();
          this.updateStats();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading users:', err);
          this.isLoading = false;
          this.actionError = 'Failed to load users.';
        }
      });
  }

  applyFilters() {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredUsers = this.users.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  updateStats() {
    this.totalUsers = this.users.length;
    this.onlineUsers = this.users.filter(u => u.online).length;
    this.adminUsers = this.users.filter(u => u.role === 'ADMIN').length;
    this.activeUsers = this.users.length; // if no 'active' field, count all
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.actionError = null;
  }

  // Role update
  updateRole(user: User, newRole: string) {
    if (user.role === newRole) return;
    this.isProcessing = true;
    this.actionError = null;

    // Assume AdminService has updateUserRole(userId, role)
    this.adminService.updateUserRole(user.id, newRole)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser: User) => {
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) this.users[index] = updatedUser;
          this.applyFilters();
          this.updateStats();
          if (this.selectedUser?.id === updatedUser.id) this.selectedUser = updatedUser;
          this.isProcessing = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.actionError = 'Failed to update role.';
          this.isProcessing = false;
        }
      });
  }

  // Toggle active status (if backend supports)
  toggleActive(user: User) {
    this.isProcessing = true;
    this.actionError = null;

    // Assume AdminService has toggleUserActive(userId)
    this.adminService.toggleUserActive(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser: User) => {
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) this.users[index] = updatedUser;
          this.applyFilters();
          this.updateStats();
          if (this.selectedUser?.id === updatedUser.id) this.selectedUser = updatedUser;
          this.isProcessing = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error toggling active:', err);
          this.actionError = 'Failed to toggle user status.';
          this.isProcessing = false;
        }
      });
  }

  refreshUsers() {
    this.loadUsers();
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
}
