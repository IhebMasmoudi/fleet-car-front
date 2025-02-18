import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ITire } from '../interfaces/ITire';

@Injectable({
  providedIn: 'root'
})
export class TiresService {
  private apiUrl = 'http://localhost:8080/api/tires'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all tires from the server.
   * @returns An observable of an array of Tire objects.
   */
  getAllTires(): Observable<ITire[]> {
    return this.http.get<ITire[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a tire by ID from the server.
   * @param id The ID of the tire to retrieve.
   * @returns An observable of a single Tire object.
   */
  getTireById(id: number): Observable<ITire> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<ITire>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Create a new tire on the server.
   * @param tire The Tire object to create.
   * @returns An observable of the created Tire object.
   */
  createTire(tire: ITire): Observable<ITire> {
    return this.http.post<ITire>(this.apiUrl, tire).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing tire on the server.
   * @param id The ID of the tire to update.
   * @param updatedTire The updated Tire object.
   * @returns An observable of the updated Tire object.
   */
  updateTire(id: number, updatedTire: ITire): Observable<ITire> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<ITire>(url, updatedTire).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a tire from the server.
   * @param id The ID of the tire to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteTire(id: number): Observable<void> {
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