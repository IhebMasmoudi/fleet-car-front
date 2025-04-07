import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IUser } from 'src/app/interfaces/IUser';
import { TokenService } from './token.service';

interface PasswordUpdateRequest {
  oldPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Base URL should point to the root of user-related endpoints
  private apiUrl = `http://localhost:8080/api/users`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  /**
   * Get all users.
   */
  getAllUsers(): Observable<IUser[]> {
    // No changes needed here
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
    // No changes needed here
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
    // No changes needed here
    return this.http.get<IUser>(`${this.apiUrl}/${id}`).pipe(
      tap(user => console.log('Fetched user:', user)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching user by ID:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a user by their Email.
   */
  getUserByEmail(email: string): Observable<IUser> {
    // No changes needed here
    return this.http.get<IUser>(`${this.apiUrl}/email/${email}`).pipe(
      tap(user => console.log('Fetched user by email:', user)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching user by email:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Update a user's details (username, email, role) - NOT password.
   * Keeps the bypass logic for 200 OK / non-JSON response error.
   */
  updateUser(id: number, username?: string, password?: string, email?: string, roleId?: number): Observable<IUser | null> {
    const params = new URLSearchParams();
    if (username) params.set('username', username);
    if (password !== undefined && password !== null) {
      console.warn("Attempting to update password via general updateUser method. Use updatePassword method instead.");
    }

    if (email) params.set('email', email);
    if (roleId != null) params.set('roleId', roleId.toString());

    console.log(`DEBUG [UserService]: Sending update params for ID ${id}:`, params.toString());

    return this.http.put<IUser>(`${this.apiUrl}/${id}`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' } // Kept as urlencoded for this specific endpoint
    }).pipe(
      tap(user => console.log('Updated user details (received valid JSON):', user)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 200 && !error.ok && error.error?.text !== undefined) {
           console.warn(`DEBUG [UserService]: User details update for ID ${id} returned HTTP 200 OK, but the response body was not valid JSON. Assuming backend success despite missing data. Bypassing client-side parse error. Response text (if any):`, error.error.text);
           return of(null);
        }
        console.error('Error updating user details:', error);
        return throwError(() => error);
      })
    );
  }

  // --- NEW METHOD for Password Update ---
  /**
   * Updates the password for the currently authenticated user.
   * Sends old and new password in the request body.
   * Requires Authorization header.
   * Expects a plain text response on success.
   * @param oldPassword The user's current password.
   * @param newPassword The desired new password.
   * @returns Observable<string> containing the success message from the backend.
   */
  updatePassword(oldPassword: string, newPassword: string): Observable<string> {
    const token = this.tokenService.getToken();

    if (!token) {
      console.error('Error updating password: No authentication token found.');
      return throwError(() => new Error('Authentication token is missing. Please log in.'));
    }

    // Construct the correct URL for the password endpoint
    const passwordUpdateUrl = `${this.apiUrl}/password`;

    // Create the request body object matching the backend's PasswordUpdateRequest class
    const body: PasswordUpdateRequest = { oldPassword, newPassword };

    // Create headers, including Authorization and Content-Type
    const headers = new HttpHeaders({
      'Content-Type': 'application/json', // Sending JSON body
      'Authorization': `Bearer ${token}`   // Standard Bearer token format
    });

    // Make the PUT request
    // IMPORTANT: Set responseType to 'text' because the backend returns a string message
    return this.http.put(passwordUpdateUrl, body, { headers: headers, responseType: 'text' })
      .pipe(
        tap(response => console.log('Password update successful:', response)), // Log success message
        catchError((error: HttpErrorResponse) => {
          // Handle potential errors (400, 401, 500, etc.)
          console.error('Error updating password:', error);
          // You might want to parse error.error if it contains a meaningful message from the backend
          let errorMsg = 'An unknown error occurred during password update.';
          if (error.error && typeof error.error === 'string') {
             errorMsg = error.error; // Use the error message from backend response body
          } else if (error.message) {
             errorMsg = error.message;
          }
          // Return an observable that emits the error message/object
          return throwError(() => new Error(errorMsg)); // Throw an error
          // Or return throwError(() => error); // Throw the original HttpErrorResponse
        })
      );
  }
  // --- END OF NEW METHOD ---


  /**
   * Delete a user by their ID.
   * Includes bypass logic for 200/204 OK / non-JSON response error.
   */
  deleteUser(id: number): Observable<string | null> {
      return this.http.delete<string>(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('Deleted user (received valid response):', response)),
      catchError((error: HttpErrorResponse) => {
         if ((error.status === 200 || error.status === 204) && !error.ok && error.error?.text !== undefined) {
           console.warn(`DEBUG [UserService]: User delete request for ID ${id} returned HTTP ${error.status}, but the response body was not valid (expected string/JSON). Assuming backend success. Bypassing client-side parse error. Response text (if any):`, error.error.text);
           return of(null);
         }
         console.error('Error deleting user:', error);
         return throwError(() => error);
      })
    );
  }
}