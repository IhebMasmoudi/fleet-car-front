import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ISupplier } from '../interfaces/ISupplier'; // Assuming you have a Supplier model

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private apiUrl = 'http://localhost:8080/api/suppliers'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all suppliers from the server.
   * @returns An observable of an array of Supplier objects.
   */
  getAllSuppliers(): Observable<ISupplier[]> {
    return this.http.get<ISupplier[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get a supplier by ID from the server.
   * @param id The ID of the supplier to retrieve.
   * @returns An observable of a single Supplier object.
   */
  getSupplierById(id: number): Observable<ISupplier> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<ISupplier>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Create a new supplier on the server.
   * @param supplier The Supplier object to create.
   * @returns An observable of the created Supplier object.
   */
  createSupplier(supplier: ISupplier): Observable<ISupplier> {
    return this.http.post<ISupplier>(this.apiUrl, supplier).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing supplier on the server.
   * @param id The ID of the supplier to update.
   * @param updatedSupplier The updated Supplier object.
   * @returns An observable of the updated Supplier object.
   */
  updateSupplier(id: number, updatedSupplier: ISupplier): Observable<ISupplier> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<ISupplier>(url, updatedSupplier).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete a supplier from the server.
   * @param id The ID of the supplier to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteSupplier(id: number): Observable<void> {
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