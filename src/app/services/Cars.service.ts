import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ICars } from '../interfaces/ICars';
import { ICarDetails } from '../interfaces/Icardetails';
@Injectable({
  providedIn: 'root',
})
export class CarsService {
  private apiUrl = 'http://localhost:8080/api/vehicles'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all vehicles from the server.
   * @returns An observable of an array of Vehicle objects.
   */
  getAllVehicles(): Observable<ICars[]> {
    return this.http.get<ICars[]>(this.apiUrl).pipe(this.handleResponse());
  }

  /**
   * Get a vehicle by ID from the server.
   * @param id The ID of the vehicle to retrieve.
   * @returns An observable of a single Vehicle object.
   */
  getVehicleById(id: number): Observable<ICars> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<ICars>(url).pipe(this.handleResponse());
  }

  /**
   * Create a new vehicle on the server.
   * @param vehicle The Vehicle object to create.
   * @returns An observable of the created Vehicle object.
   */
  createVehicle(vehicle: ICars): Observable<ICars> {
    return this.http
      .post<ICars>(this.apiUrl, vehicle)
      .pipe(this.handleResponse());
  }

  /**
   * Update an existing vehicle on the server.
   * @param id The ID of the vehicle to update.
   * @param updatedVehicle The updated Vehicle object.
   * @returns An observable of the updated Vehicle object.
   */
  updateVehicle(id: number, updatedVehicle: ICars): Observable<ICars> {
    const url = `${this.apiUrl}/${id}`;
    return this.http
      .put<ICars>(url, updatedVehicle)
      .pipe(this.handleResponse());
  }

  /**
   * Delete a vehicle from the server.
   * @param id The ID of the vehicle to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteVehicle(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(this.handleResponse());
  }

  /**
   * Handle HTTP response and only throw errors for non-200 statuses.
   */
  private handleResponse<T>() {
    return (source: Observable<T>) =>
      source.pipe(
        catchError((error: HttpErrorResponse) => {
          // Only throw errors for non-200 statuses
          if (error.status !== 200) {
            console.error('Error:', error);
            return throwError(
              () => new Error(error.message || 'An unknown error occurred')
            );
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
   * Get vehicle details by ID from the server.
   * @param id The ID of the vehicle to retrieve details for.
   * @returns An observable of VehicleDetailsDto.
   */
 getVehicleDetails(id: number): Observable<ICarDetails> {
  const url = `${this.apiUrl}/${id}/details`;
  return this.http.get<ICarDetails>(url).pipe(
    this.handleResponse()
  );
}
}
