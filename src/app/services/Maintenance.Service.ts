import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IMaintenance } from '../interfaces/IMaintenance'; // Assuming you have a Maintenance model

@Injectable({
  providedIn: 'root'
})
export class MaintenancesService {
  private apiUrl = 'http://localhost:8080/api/maintenances'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all maintenances from the server.
   * @returns An observable of an array of Maintenance objects.
   */
  getAllMaintenances(): Observable<IMaintenance[]> {
    return this.http.get<IMaintenance[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a maintenance by ID from the server.
   * @param id The ID of the maintenance to retrieve.
   * @returns An observable of a single Maintenance object.
   */
  getMaintenanceById(id: number): Observable<IMaintenance> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<IMaintenance>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Create a new maintenance on the server.
   * @param maintenance The Maintenance object to create.
   * @returns An observable of the created Maintenance object.
   */
  createMaintenance(maintenance: IMaintenance): Observable<IMaintenance> {
    return this.http.post<IMaintenance>(this.apiUrl, maintenance).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing maintenance on the server.
   * @param id The ID of the maintenance to update.
   * @param updatedMaintenance The updated Maintenance object.
   * @returns An observable of the updated Maintenance object.
   */
  updateMaintenance(id: number, updatedMaintenance: IMaintenance): Observable<IMaintenance> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<IMaintenance>(url, updatedMaintenance).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a maintenance from the server.
   * @param id The ID of the maintenance to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteMaintenance(id: number): Observable<void> {
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