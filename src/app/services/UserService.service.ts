import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IUser } from 'src/app/interfaces/IUser';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `http://localhost:8080/api/users`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users.
   */
  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}`).pipe(
      tap(users => console.log('Fetched users:', users)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching users:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get users with the role "Driver".
   */
  getUsersByRoleDriver(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}/drivers`).pipe(
      tap(users => console.log('Fetched driver users:', users)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching driver users:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a user by their ID.
   */
  getUserById(id: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/${id}`).pipe(
      tap(user => console.log('Fetched user:', user)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching user:', error);
        return throwError(() => error);
      })
    );
  }
/**
   * Get a user by their Email.
   */

  getUserByEmail(email: string): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/email/${email}`).pipe(
      tap(user => console.log('Fetched user by email:', user)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching user by email:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Update a user's details and role.
   */
  updateUser(id: number, username?: string, password?: string, email?: string, roleId?: number): Observable<IUser> {
    const params = new URLSearchParams();
    if (username) params.set('username', username);
    if (password) params.set('password', password);
    if (email) params.set('email', email);
    if (roleId) params.set('roleId', roleId.toString());

    return this.http.put<IUser>(`${this.apiUrl}/${id}`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(user => console.log('Updated user:', user)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating user:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a user by their ID.
   */
  deleteUser(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('Deleted user:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting user:', error);
        return throwError(() => error);
      })
    );
  }
}
