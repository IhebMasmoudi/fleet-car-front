import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IDriver } from '../interfaces/IDriver';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = 'http://localhost:8080/api/drivers';

  constructor(private http: HttpClient) {}

  /**
   * Get all drivers.
   */
  getAllDrivers(): Observable<IDriver[]> {
    return this.http.get<IDriver[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get a driver by ID.
   * @param id The ID of the driver.
   */
  getDriverById(id: number): Observable<IDriver> {
    return this.http.get<IDriver>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new driver.
   * @param driver The driver details.
   */
  createDriver(driver: IDriver): Observable<IDriver> {
    return this.http.post<IDriver>(this.apiUrl, driver).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing driver.
   * @param id The ID of the driver to update.
   * @param driver The updated driver details.
   */
  updateDriver(id: number, driver: IDriver): Observable<IDriver> {
    return this.http.put<IDriver>(`${this.apiUrl}/${id}`, driver).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a driver by ID.
   * @param id The ID of the driver to delete.
   */
  deleteDriver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Assign a vehicle to a driver.
   * @param driverId The ID of the driver.
   * @param vehicleId The ID of the vehicle (optional).
   */
  assignVehicle(driverId: number, vehicleId?: number): Observable<IDriver> {
    const url = `${this.apiUrl}/${driverId}/assign-vehicle`;
    const params = vehicleId ? new HttpParams().set('vehicleId', vehicleId.toString()) : new HttpParams();
    return this.http.post<IDriver>(url, null, { params: params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Remove a vehicle from a driver.
   * @param driverId The ID of the driver.
   */
  removeVehicle(driverId: number): Observable<IDriver> {
    const url = `${this.apiUrl}/${driverId}/remove-vehicle`;
    return this.http.post<IDriver>(url, null).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors.
   * @param error The HTTP error response.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error(error.message || 'An unknown error occurred'));
  }
}