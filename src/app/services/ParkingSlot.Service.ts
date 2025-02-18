import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IParkingSlot } from '../interfaces/IParkingSlot'; // Assuming you have a ParkingSlot model

@Injectable({
  providedIn: 'root'
})
export class ParkingSlotsService {
  private apiUrl = 'http://localhost:8080/api/parking-slots'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all parking slots from the server.
   * @returns An observable of an array of ParkingSlot objects.
   */
  getAllParkingSlots(): Observable<IParkingSlot[]> {
    return this.http.get<IParkingSlot[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a parking slot by ID from the server.
   * @param id The ID of the parking slot to retrieve.
   * @returns An observable of a single ParkingSlot object.
   */
  getParkingSlotById(id: number): Observable<IParkingSlot> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<IParkingSlot>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Create a new parking slot on the server.
   * @param parkingSlot The ParkingSlot object to create.
   * @returns An observable of the created ParkingSlot object.
   */
  createParkingSlot(parkingSlot: IParkingSlot): Observable<IParkingSlot> {
    return this.http.post<IParkingSlot>(this.apiUrl, parkingSlot).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing parking slot on the server.
   * @param id The ID of the parking slot to update.
   * @param updatedParkingSlot The updated ParkingSlot object.
   * @returns An observable of the updated ParkingSlot object.
   */
  updateParkingSlot(id: number, updatedParkingSlot: IParkingSlot): Observable<IParkingSlot> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<IParkingSlot>(url, updatedParkingSlot).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a parking slot from the server.
   * @param id The ID of the parking slot to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteParkingSlot(id: number): Observable<void> {
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