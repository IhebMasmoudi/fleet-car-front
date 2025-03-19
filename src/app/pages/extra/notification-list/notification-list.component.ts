import { Component, OnInit, OnDestroy } from '@angular/core';
import { Notification } from 'src/app/interfaces/Notification';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/AuthService.Service';
import { NotificationService } from 'src/app/services/Notification.Service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
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
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  isAdmin = false;
  private subscriptions: Subscription = new Subscription();
  showAllNotifications = false; // Track whether to show all notifications or just the last 5

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.isAdmin().subscribe(isAdmin => {
        this.isAdmin = isAdmin;
      })
    );

    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );

    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe({
        next: (fetchedNotifications) => {
          // Correctly map 'read' from API to component's 'isRead'
          this.notifications = fetchedNotifications.map(notification => ({
            ...notification,
            isRead: notification.read
          }));
          this.notificationService.updateNotificationList(this.notifications); // Update shared list with correct isRead status
        },
        error: err => {
          console.error('Error fetching notifications:', err);
          this.snackBar.open('Failed to load notifications', 'Close', { duration: 3000 });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.subscriptions.add(
        this.notificationService.markAsRead(notification.id).subscribe({
          next: (updatedNotifications) => { // Receive updated notification list from backend
            this.notifications = updatedNotifications; // Update local notifications with fresh data
            this.notificationService.updateNotificationList(this.notifications); // Update shared list
            this.snackBar.open('Notification marked as read', 'Close', { duration: 3000 });
          },
          error: err => {
            console.error('Error marking as read:', err);
            this.snackBar.open('Failed to mark as read', 'Close', { duration: 3000 });
          }
        })
      );
    }
    if (notification.actionLink) {
      this.router.navigateByUrl(notification.actionLink);
    }
  }

  markAllAsRead(): void {
    this.subscriptions.add(
      this.notificationService.markAllAsRead().subscribe({
        next: (updatedNotifications) => { // Receive updated notification list from backend
          this.notifications = updatedNotifications; // Update local notifications with fresh data
          this.notificationService.updateNotificationList(this.notifications); // Update shared list
          this.snackBar.open('All notifications marked as read', 'Close', { duration: 3000 });
        },
        error: err => {
          console.error('Error marking all as read:', err);
          this.snackBar.open('Failed to mark all as read', 'Close', { duration: 3000 });
        }
      })
    );
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  createNotification(data: { title: string; message: string; targetRole: string }): void {
    if (this.isAdmin) {
      this.subscriptions.add(
        this.notificationService.createNotification(data.title, data.message, data.targetRole).subscribe({
          next: (newNotification) => {
            // Assuming the backend returns the newly created notification with correct 'read' status
            this.notifications = [newNotification!, ...this.notifications];
            this.notificationService.updateNotificationList(this.notifications); // Update shared list
            this.snackBar.open('Notification sent successfully', 'Close', { duration: 3000 });
          },
          error: err => {
            console.error('Error creating notification:', err);
            this.snackBar.open('Failed to create notification', 'Close', { duration: 3000 });
          }
        })
      );
    }
  }

  // Toggle visibility of all notifications
  toggleNotifications(): void {
    this.showAllNotifications = !this.showAllNotifications;
  }

  getVisibleNotifications(): Notification[] {
    const sortedNotifications = [...this.notifications].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // Return last 3 notifications when collapsed, full list when expanded
    return this.showAllNotifications ? sortedNotifications : sortedNotifications.slice(0, 3); // Show last 3 when collapsed
  }
}