import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Notification } from '../interfaces/Notification';
import { map, tap, catchError } from 'rxjs/operators';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { AuthService } from './AuthService.Service';
import { UserService } from './UserService.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';
  private stompClient: Client | null = null;
  private token: string | null = null;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.initializeService();
  }

  private initializeService(): void {
    this.loadToken();
    if (this.token) {
      this.authService.loadUserProfile().subscribe(() => {
        // After the profile is loaded, fetch notifications and initialize WebSocket
        this.loadNotifications();
        const userId = this.authService.getUserId();
        if (userId) {
          this.initializeWebSocketConnection(userId);
        } else {
          console.error('User ID not available after profile load.');
        }
      });
    } else {
      console.error('No token available, cannot initialize notification service.');
      this.disconnectWebSocket();
    }
  }

  private loadToken(): void {
    this.token = this.authService.getToken();
    console.log('JWT Token:', this.token || 'No token found');
  }

  private loadNotifications(): void {
    this.getNotifications().subscribe();
  }

  private initializeWebSocketConnection(userId: string): void {
    this.disconnectWebSocket(); // Prevent duplicate connections

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS.default('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected for userId:', userId);
      this.stompClient?.subscribe(`/user/${userId}/queue/notifications`, message => {
        if (message.body) {
          const notification: Notification = JSON.parse(message.body);
          this.addNewNotification(notification);
        }
      });
    };

    this.stompClient.onStompError = frame => {
      console.error('WebSocket error:', frame);
    };

    this.stompClient.activate();
  }

  private disconnectWebSocket(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  addNewNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next([notification, ...currentNotifications]);
    if (!notification.isRead) {
      this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);
    }
  }

  getNotifications(): Observable<Notification[]> {
    const userId = this.authService.getUserId();
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for notifications:', userId);
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(notifications.filter(n => !n.isRead).length);
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return of([]); // Return empty array in case of error
      })
    );
  }

  getUnreadCount(): Observable<number> {
    const userId = this.authService.getUserId();
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for unread count:', userId);
      return new Observable(observer => {
        observer.next(0);
        observer.complete();
      });
    }
    return this.http.get<{ count: number }>(`${this.apiUrl}/user/${userId}/unread/count`).pipe(
      map(response => response.count),
      tap(count => this.unreadCountSubject.next(count)),
       catchError(error => {
        console.error('Error fetching unread count:', error);
        return of(0); // Return 0 in case of error
      })
    );
  }

  updateNotificationList(notifications: Notification[]): void { // ADDED METHOD
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(notifications.filter(n => !n.isRead).length);
  }

  markAsRead(id: number): Observable<Notification[]> { // Changed return type to Observable<Notification[]>
    const userId = this.authService.getUserId();
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for marking notification as read:', userId);
      return new Observable(observer => {
        observer.complete();
      });
    }
    return this.http.put<Notification[]>(`${this.apiUrl}/${id}/read?userId=${userId}`, {}) // Expecting Notification[] response
      .pipe(
        tap((updatedNotifications: Notification[]) => { // Capture updated list
          this.notificationsSubject.next(updatedNotifications); // Update with the fresh list from backend
          this.unreadCountSubject.next(updatedNotifications.filter(n => !n.isRead).length);
        }),
        catchError(error => { // Add catchError for error handling
          console.error('Error marking as read:', error);
          return of(this.notificationsSubject.value);
        })
      );
  }

  markAllAsRead(): Observable<Notification[]> { // Changed return type to Observable<Notification[]>
    const userId = this.authService.getUserId();
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for marking all notifications as read:', userId);
      return new Observable(observer => {
        observer.complete();
      });
    }
    return this.http.put<Notification[]>(`${this.apiUrl}/user/${userId}/read-all`, {}) // Expecting Notification[] response
      .pipe(
        tap((updatedNotifications: Notification[]) => { // Capture updated list
          this.notificationsSubject.next(updatedNotifications); // Update with the fresh list from backend
          this.unreadCountSubject.next(updatedNotifications.filter(n => !n.isRead).length);
        }),
        catchError(error => { // Add catchError for error handling
          console.error('Error marking all as read:', error);
          return of(this.notificationsSubject.value);
        })
      );
  }

  createNotification(title: string, message: string, targetRole: string): Observable<void> {
    const payload = { title, message, targetRole, senderRole: this.authService.getRole() };
    return this.http.post<void>(`${this.apiUrl}/create`, payload);
  }
}