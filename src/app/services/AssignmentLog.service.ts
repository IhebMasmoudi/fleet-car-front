import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IAssignmentLog } from '../interfaces/IAssignmentLog';

@Injectable({
  providedIn: 'root'
})
export class AssignmentLogService {
  private apiUrl = 'http://localhost:8080/api/assignments'; 

  constructor(private http: HttpClient) {}

  /**
   * Get all assignment history
   */
  getAllAssignmentHistory(): Observable<IAssignmentLog[]> {
    return this.http.get<IAssignmentLog[]>(`${this.apiUrl}/history`).pipe(
      map(response => {
        if (!response || !Array.isArray(response) || response.length === 0) {
          throw new Error('No valid assignment data received.');
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get assignment history for a specific driver
   * @param driverId The ID of the driver
   */
  getAssignmentHistoryByDriver(driverId: number): Observable<IAssignmentLog[]> {
    return this.http.get<IAssignmentLog[]>(`${this.apiUrl}/history/driver/${driverId}`).pipe(
      map(response => {
        if (!response || !Array.isArray(response) || response.length === 0) {
          throw new Error('No valid assignment data received for driver.');
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get assignment history for a specific vehicle
   * @param vehicleId The ID of the vehicle
   */
  getAssignmentHistoryByVehicle(vehicleId: number): Observable<IAssignmentLog[]> {
    return this.http.get<IAssignmentLog[]>(`${this.apiUrl}/history/vehicle/${vehicleId}`).pipe(
      map(response => {
        if (!response || !Array.isArray(response) || response.length === 0) {
          throw new Error('No valid assignment data received for vehicle.');
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse | Error) {
    console.error('An error occurred:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }
}