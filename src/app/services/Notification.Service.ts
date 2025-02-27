import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../interfaces/Notification';
import { map, tap } from 'rxjs/operators';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { AuthService } from './AuthService.Service';
import { IUser } from '../interfaces/IUser';
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
      this.loadUserProfile();
    } else {
      console.error('No token available, cannot initialize notification service.');
      this.disconnectWebSocket();
    }
  }

  /** Load the JWT token from local storage. */
  private loadToken(): void {
    this.token = this.authService.getToken();
    console.log('JWT Token:', this.token || 'No token found');
  }

  /**
   * Load the logged-in user's profile and initialize WebSocket/notifications.
   * Always decode the token and set userId from the user's numeric ID.
   */
  private loadUserProfile(): void {
    if (this.token) {
      const decoded = this.decodeToken(this.token);
      const email = decoded?.sub; // Assuming 'sub' contains the email
      if (email) {
        this.userService.getAllUsers().subscribe({
          next: (users: IUser[]) => {
            const foundUser = users.find(u => u.email === email);
            if (foundUser && foundUser.id) {
              const userId = foundUser.id.toString(); // Convert numeric ID to string
              this.authService.setUserId(userId); // Set numeric userId
              console.log('Set userId to:', userId);
              console.log('User loaded:', foundUser);
              // Initialize WebSocket and fetch notifications after userId is set
              this.initializeWebSocketConnection(userId);
              this.getNotifications().subscribe(notifications => {
                this.notificationsSubject.next(notifications);
              });
              this.getUnreadCount().subscribe(count => {
                this.unreadCountSubject.next(count);
              });
            } else {
              console.error('No user found for email:', email);
            }
          },
          error: (err) => console.error('Error fetching users:', err)
        });
      } else {
        console.error('No email found in token');
      }
    } else {
      console.error('No token available');
    }
  }

  /** Decode JWT token and return the payload. */
  private decodeToken(token: string): any {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  private initializeWebSocketConnection(userId: string): void {
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for WebSocket connection:', userId);
      return;
    }
    this.disconnectWebSocket(); // Ensure no duplicate connections

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS.default('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected for userId:', userId);
      this.stompClient?.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        if (message.body) {
          const notification: Notification = JSON.parse(message.body);
          this.addNewNotification(notification);
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
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
      return new Observable(observer => observer.next([]));
    }
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`);
  }

  getUnreadCount(): Observable<number> {
    const userId = this.authService.getUserId();
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for unread count:', userId);
      return new Observable(observer => observer.next(0));
    }
    return this.http.get<{ count: number }>(`${this.apiUrl}/user/${userId}/unread/count`).pipe(
      map(response => response.count),
      tap(count => this.unreadCountSubject.next(count))
    );
  }

  markAsRead(id: number): Observable<void> {
    const userId = this.authService.getUserId();
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for marking notification as read:', userId);
      return new Observable(observer => observer.complete());
    }
    return this.http.put<void>(`${this.apiUrl}/${id}/read?userId=${userId}`, {}).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.getValue().map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.getValue() - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    const userId = this.authService.getUserId();
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid userId for marking all notifications as read:', userId);
      return new Observable(observer => observer.complete());
    }
    return this.http.put<void>(`${this.apiUrl}/user/${userId}/read-all`, {}).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.getValue().map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  createNotification(title: string, message: string, targetRole: string): Observable<void> {
    const payload = { title, message, targetRole, senderRole: this.authService.getRole() };
    return this.http.post<void>(`${this.apiUrl}/create`, payload);
  }
}