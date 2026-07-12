import {Component, DestroyRef, inject, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GroupService} from '../../services/group-service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-invite-modal',
  imports: [],
  templateUrl: './invite-modal.html',
  styleUrl: './invite-modal.css',
})
export class InviteModal implements OnInit{
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private destroyRef = inject(DestroyRef)
  private service = inject(GroupService)
  private token: string | null = ""
  private error = '';
  private loading = false;
  private success = false;

  ngOnInit(): void {
    this.join()
  }

  join() {
    this.token = this.route.snapshot.queryParamMap.get('token')
    if (!this.token) {
      this.error = 'No invite token provided.';
      return;
    }

    this.loading = true
    this.service.joinGroup(this.token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          const id = response.id
          this.router.navigate(['/dashboard'], {
            queryParams: { id }
          }); // adjust based on response
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to join group. Please try again.';
      }
    })
  }

}
