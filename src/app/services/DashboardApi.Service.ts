import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Import your models
import { DashboardSummary } from 'src/app/interfaces/DashboardSummary';
import { VehicleMileage } from 'src/app/interfaces/VehicleMileage';
import { Insurance} from 'src/app/interfaces/IInsurance';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {

  // Use environment variable or define base URL directly
  private baseUrl = 'http://localhost:8080/api/dashboard'; // Backend API URL

  constructor(private http: HttpClient) { }

  /**
   * Fetches the main dashboard summary data including KPIs.
   * Corresponds to GET /api/v1/dashboard/summary
   */
  getSummary(): Observable<DashboardSummary> {
    const url = `${this.baseUrl}/summary`;
    console.log(`Fetching dashboard summary from: ${url}`); // Log the URL
    return this.http.get<DashboardSummary>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Fetches the top N vehicles by mileage.
   * Corresponds to GET /api/v1/dashboard/vehicles/high-mileage?count={count}
   * @param count The number of vehicles to retrieve.
   */
  getTopMileageVehicles(count: number): Observable<VehicleMileage[]> {
    const url = `${this.baseUrl}/vehicles/high-mileage`;
    let params = new HttpParams().set('count', count.toString());
    console.log(`Fetching top mileage vehicles from: ${url} with count: ${count}`); // Log
    return this.http.get<VehicleMileage[]>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Fetches insurance DTOs expiring within the specified number of days.
   * Corresponds to GET /api/v1/dashboard/insurances/expiring-soon?days={days}
   * @param daysAhead The lookahead period in days.
   */
  getExpiringInsurances(daysAhead: number): Observable<Insurance[]> {
    const url = `${this.baseUrl}/insurances/expiring-soon`;
    let params = new HttpParams().set('days', daysAhead.toString());
    console.log(`Fetching expiring insurances from: ${url} with days: ${daysAhead}`); // Log
    return this.http.get<Insurance[]>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Basic error handling
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message || error.error?.message}`;
      // You might want to parse specific error structures from your backend
      // if (error.error && typeof error.error === 'object' && error.error.message) {
      //   errorMessage = `Server Error: ${error.error.message}`;
      // }
    }
    console.error(errorMessage, error); // Log the detailed error
    return throwError(() => new Error('Failed to fetch dashboard data. Please check console for details or try again later.'));
  }
}