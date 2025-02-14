import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { IUser } from 'src/app/interfaces/IUser'; // Assuming you have a User model

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `http://localhost:8080/api/users`; // Base URL for user endpoints

  constructor(private http: HttpClient) {}

  /**
   * Get all users.
   */
  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}`).pipe(
      this.handleResponse(),
      tap((users) => console.log('Fetched users:', users))
    );
  }

  /**
   * Get a user by their ID.
   *
   * @param id - The ID of the user.
   */
  getUserById(id: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/${id}`).pipe(
      this.handleResponse(),
      tap((user) => console.log('Fetched user:', user))
    );
  }

  /**
   * Update a user's details and role.
   *
   * @param id - The ID of the user to update.
   * @param updatedUser - The updated user data, including role ID.
   */
  updateUser(
    id: number,
    username?: string,
    password?: string,
    email?: string,
    roleId?: number
  ): Observable<IUser> {
    const params = new URLSearchParams();
    if (username) params.set('username', username);
    if (password) params.set('password', password);
    if (email) params.set('email', email);
    if (roleId) params.set('roleId', roleId.toString());

    return this.http.put<IUser>(`${this.apiUrl}/${id}`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a user by their ID.
   *
   * @param id - The ID of the user to delete.
   */
  deleteUser(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`).pipe(
      this.handleResponse()
    );
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