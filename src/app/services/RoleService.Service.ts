import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {IRole } from '../interfaces/IRole'; // Assuming you have a Role model

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
      catchError(this.handleError)
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
      catchError(this.handleError)
    );
  }

  /**
   * Create a new role on the server.
   * @param role The Role object to create.
   * @returns An observable of the created Role object.
   */
  createRole(role: IRole): Observable<IRole> {
    return this.http.post<IRole>(this.apiUrl, role).pipe(
      catchError(this.handleError)
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
      catchError(this.handleError)
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
      catchError(this.handleError)
    );
  }

  /**
   * Error handling function for HTTP requests.
   * @param error The error response from the server.
   * @returns An observable with the error message.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server returned code ${error.status}, error message: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}