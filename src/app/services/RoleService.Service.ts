import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IRole } from '../interfaces/IRole'; // Assuming you have a Role model

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'http://localhost:8080/api/roles'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all roles from the server.
   * @returns An observable of an array of Role objects.
   */
  getAllRoles(): Observable<IRole[]> {
    return this.http.get<IRole[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a role by ID from the server.
   * @param id The ID of the role to retrieve.
   * @returns An observable of a single Role object.
   */
  getRoleById(id: number): Observable<IRole> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<IRole>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Create a new role on the server.
   * @param role The Role object to create.
   * @returns An observable of the created Role object.
   */
  createRole(role: IRole): Observable<IRole> {
    return this.http.post<IRole>(this.apiUrl, role).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing role on the server.
   * @param id The ID of the role to update.
   * @param updatedRole The updated Role object.
   * @returns An observable of the updated Role object.
   */
  updateRole(id: number, updatedRole: IRole): Observable<IRole> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<IRole>(url, updatedRole).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a role from the server.
   * @param id The ID of the role to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteRole(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
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