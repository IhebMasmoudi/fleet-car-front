import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import { Observable, throwError,of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IMaintenance } from '../interfaces/IMaintenance'; // Assuming you have a Maintenance model
import { AuthService } from 'src/app/services/AuthService.Service';

@Injectable({
  providedIn: 'root'
})
export class MaintenancesService {
  private apiUrl = 'http://localhost:8080/api/maintenances'; // Backend API URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Get all maintenances from the server. (ADMIN/MANAGER)
   * @returns An observable of an array of Maintenance objects.
   */
  getAllMaintenances(): Observable<IMaintenance[]> {
    return this.http.get<IMaintenance[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a maintenance by ID from the server. (ADMIN/MANAGER/DRIVER)
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
   * Create a new maintenance request (DRIVER).
   * @param maintenance The Maintenance object to create.
   * @param driverId The ID of the driver making the request.
   * @returns An observable of the created Maintenance object.
   */
  createMaintenanceRequest(maintenance: IMaintenance, driverId: number): Observable<IMaintenance> {
    const url = `${this.apiUrl}/request/${driverId}`;
    return this.http.post<IMaintenance>(url, maintenance).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing maintenance on the server. (ADMIN/MANAGER)
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
   * Delete a maintenance from the server. (ADMIN/MANAGER)
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
   * Accept a maintenance request (ADMIN/MANAGER).
   * @param maintenanceId The ID of the maintenance to accept.
   * @returns An observable of the accepted Maintenance object.
   */
  acceptMaintenance(maintenanceId: number): Observable<IMaintenance> {
    const url = `${this.apiUrl}/${maintenanceId}/accept`;
    return this.http.post<IMaintenance>(url, {}).pipe( // Empty body for POST request
      this.handleResponse()
    );
  }

  /**
   * Reject a maintenance request (ADMIN/MANAGER).
   * @param maintenanceId The ID of the maintenance to reject.
   * @returns An observable of the rejected Maintenance object.
   */
  rejectMaintenance(maintenanceId: number): Observable<IMaintenance> {
    const url = `${this.apiUrl}/${maintenanceId}/reject`;
    return this.http.post<IMaintenance>(url, {}).pipe( // Empty body for POST request
      this.handleResponse()
    );
  }

  /**
   * Get all pending maintenance requests (ADMIN/MANAGER).
   * @returns An observable of an array of pending Maintenance objects.
   */
  getAllPendingMaintenances(): Observable<IMaintenance[]> {
    const url = `${this.apiUrl}/pending`;
    return this.http.get<IMaintenance[]>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get maintenances by driver ID (DRIVER).
   * @param driverId The ID of the driver.
   * @returns An observable of an array of Maintenance objects for the driver.
   */
  getMaintenancesByDriverId(driverId: number): Observable<IMaintenance[]> {
    const url = `${this.apiUrl}/driver/${driverId}`;
    return this.http.get<IMaintenance[]>(url).pipe(
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
        if (error.status !== 200 && error.status !== 201 ) { //Include 201 for POST requests that return Created
          console.error('Error:', error);
          return throwError(() => new Error(error.message || 'An unknown error occurred'));
        }
        // For 200 OK or 201 Created, return the response without throwing an error
        return of(error as any); // Cast to 'any' to avoid type mismatch, as we're returning HttpErrorResponse in success cases
      }),
      map((response: any) => {
        if (response instanceof HttpErrorResponse && (response.status === 200 || response.status === 201)) {
          return response.error; // For successful responses, return the actual data (response.error in case of HttpErrorResponse)
        }
        return response; // If it's not HttpErrorResponse, return as is (assuming it's the data already)
      })
    );
  }
}