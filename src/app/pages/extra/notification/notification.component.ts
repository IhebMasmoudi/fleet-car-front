import { Component, OnInit, OnDestroy } from '@angular/core';
import { Notification } from 'src/app/interfaces/Notification';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/AuthService.Service';
import { NotificationService } from 'src/app/services/Notification.Service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatBadgeModule,
    MatSnackBarModule,
    FormsModule
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isAdmin = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Determine if user is admin
    this.isAdmin = this.authService.getRole() === 'ADMIN';

    // Subscribe to notifications and unread count streams
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifs => this.notifications = notifs)
    );
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count)
    );

    // Load initial notifications from REST endpoints
    this.notificationService.getNotifications().subscribe();
    this.notificationService.getUnreadCount().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
        },
        error: err => {
          console.error('Error marking as read:', err);
        }
      });
    }
    if (notification.actionLink) {
      this.router.navigateByUrl(notification.actionLink);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  navigateToNotificationList(): void {
    this.router.navigate(['/extra/notification-list']);
  }
}