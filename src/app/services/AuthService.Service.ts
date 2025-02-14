import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

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
}