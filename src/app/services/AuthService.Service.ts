import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserService } from 'src/app/services/UserService.service';
import { IUser } from 'src/app/interfaces/IUser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  user: IUser | null = null;
  token: string | null = null;

  constructor(private http: HttpClient, private userService: UserService) {}

  /**
   * Login user.
   */
  /**
   * Login user.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      this.handleResponse()
    );
  }

  /**
   * Register user.
   */
  register(username: string, password: string, email: string, roleId: number): Observable<any> {
    const params = new URLSearchParams();
    params.set('username', username);
    params.set('password', password);
    params.set('email', email);
    params.set('roleId', roleId.toString());

    // Append query parameters to the URL
    const url = `${this.apiUrl}/register?${params.toString()}`;

    return this.http.post(url, null).pipe(
      this.handleResponse()
    );
  }

  /**
   * Logout user.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  }

  /**
   * Check if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Handle HTTP response and only throw errors for non-200 statuses.
   */
  private handleResponse<T>() {
    return (source: Observable<T>) => source.pipe(
      catchError((error: HttpErrorResponse) => {
        // Only throw errors for non-200 statuses
        if (error.status !== 200) {
          console.error('Error:', error);
          return throwError(() => new Error(error.message || 'An unknown error occurred'));
        }
        // For 200 OK, return the response without throwing an error
        return [error];
      }),
      map((response: any) => {
        // Optionally log the response for debugging
        console.log('Response:', response);
        return response;
      })
    );
  }

  /**
   * Check if the user is an admin.
   */
  isAdmin(): Observable<boolean> {
    return this.loadUserProfile().pipe(
      map(role => {
        console.log('User role:', role);
        return role === 'ADMIN';
      })
    );
  }

  /**
   * Get the JWT token from local storage.
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Set the JWT token in local storage.
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Get the user role from local storage.
   */
  getRole(): string | null {
    const role = localStorage.getItem('role');
    console.log('Retrieved role from local storage:', role);
    return role;
  }

  /**
   * Set the user role in local storage.
   */
  setRole(role: string): void {
    console.log('Setting role in local storage:', role);
    localStorage.setItem('role', role);
  }

  /**
   * Get the user ID from local storage.
   */
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Set the user ID in local storage.
   */
  setUserId(userId: string): void {
    localStorage.setItem('userId', userId);
  }

  /**
   * Get the user name from local storage.
   */
  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  /**
   * Set the user name in local storage.
   */
  setUserName(userName: string): void {
    localStorage.setItem('userName', userName);
  }

  /**
   * Load the logged-in user's profile and return the role.
   * If the user ID is missing, decode the token and look up the user by email.
   */
  private loadUserProfile(): Observable<string | null> {
    let userId = this.getUserId();
    if (!userId && this.token) {
      // Decode the token to get the email (assuming the token payload contains the email in "sub")
      const decoded = this.decodeToken(this.token);
      const email = decoded?.sub;
      if (email) {
        console.log('Email from token:', email);
        // Fetch all users and find the one with the matching email
        return this.userService.getAllUsers().pipe(
          map((users: IUser[]) => {
            const foundUser = users.find(u => u.email === email);
            if (foundUser) {
              // Store user details for later use
              this.setUserId(foundUser.id?.toString() || '');
              this.setUserName(foundUser.username);
              this.setRole(foundUser.role); // Set role
              this.user = foundUser;
              console.log('User profile loaded by email:', foundUser);
              return foundUser.role;
            } else {
              console.error('User not found for email:', email);
              return null;
            }
          }),
          catchError((err) => {
            console.error('Error fetching users:', err);
            return of(null);
          })
        );
      } else {
        console.error('Email not found in token.');
        return of(null);
      }
    } else if (userId) {
      return this.userService.getUserById(Number(userId)).pipe(
        map((user: IUser) => {
          this.user = user;
          this.setRole(user.role); // Set role
          console.log('User profile loaded:', user);
          return user.role;
        }),
        catchError((err) => {
          console.error('Error fetching user profile:', err);
          return of(null);
        })
      );
    } else {
      return of(this.getRole());
    }
  }

  /**
   * Decode JWT token.
   */
  decodeToken(token: string): any {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Decode JWT token and set the role in local storage.
   */
  private decodeAndSetRole(token: string): void {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      const decoded = JSON.parse(payload);
      const role = decoded.role; // Assuming the role is stored in the token payload
      if (role) {
        this.setRole(role);
      } else {
        console.error('Role not found in token payload:', decoded);
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }
}