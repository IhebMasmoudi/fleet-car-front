import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IMission } from '../interfaces/IMission'; // Assuming you have a Mission model

@Injectable({
  providedIn: 'root'
})
export class MissionsService {
  private apiUrl = 'http://localhost:8080/api/missions'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all missions from the server.
   * @returns An observable of an array of Mission objects.
   */
  getAllMissions(): Observable<IMission[]> {
    return this.http.get<IMission[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a mission by ID from the server.
   * @param id The ID of the mission to retrieve.
   * @returns An observable of a single Mission object.
   */
  getMissionById(id: number): Observable<IMission> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<IMission>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Create a new mission on the server.
   * @param mission The Mission object to create.
   * @returns An observable of the created Mission object.
   */
  createMission(mission: IMission): Observable<IMission> {
    return this.http.post<IMission>(this.apiUrl, mission).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing mission on the server.
   * @param id The ID of the mission to update.
   * @param updatedMission The updated Mission object.
   * @returns An observable of the updated Mission object.
   */
  updateMission(id: number, updatedMission: IMission): Observable<IMission> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<IMission>(url, updatedMission).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a mission from the server.
   * @param id The ID of the mission to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteMission(id: number): Observable<void> {
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