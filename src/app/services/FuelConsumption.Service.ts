import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IFuelConsumption } from '../interfaces/IFuelConsumption'; // Assuming you have a FuelConsumption model

@Injectable({
  providedIn: 'root'
})
export class FuelConsumptionsService {
  private apiUrl = 'http://localhost:8080/api/fuel-consumptions'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all fuel consumptions from the server.
   * @returns An observable of an array of FuelConsumption objects.
   */
  getAllFuelConsumptions(): Observable<IFuelConsumption[]> {
    return this.http.get<IFuelConsumption[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a fuel consumption by ID from the server.
   * @param id The ID of the fuel consumption to retrieve.
   * @returns An observable of a single FuelConsumption object.
   */
  getFuelConsumptionById(id: number): Observable<IFuelConsumption> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<IFuelConsumption>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Create a new fuel consumption on the server.
   * @param fuelConsumption The FuelConsumption object to create.
   * @returns An observable of the created FuelConsumption object.
   */
  createFuelConsumption(fuelConsumption: IFuelConsumption): Observable<IFuelConsumption> {
    return this.http.post<IFuelConsumption>(this.apiUrl, fuelConsumption).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing fuel consumption on the server.
   * @param id The ID of the fuel consumption to update.
   * @param updatedFuelConsumption The updated FuelConsumption object.
   * @returns An observable of the updated FuelConsumption object.
   */
  updateFuelConsumption(id: number, updatedFuelConsumption: IFuelConsumption): Observable<IFuelConsumption> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<IFuelConsumption>(url, updatedFuelConsumption).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a fuel consumption from the server.
   * @param id The ID of the fuel consumption to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteFuelConsumption(id: number): Observable<void> {
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