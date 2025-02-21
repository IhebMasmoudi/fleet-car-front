import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IInvoice } from '../interfaces/IInvoice';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private apiUrl = 'http://localhost:8080/api/invoices'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Create a new invoice.
   * @param IInvoice The invoice details in DTO format.
   * @returns An observable of the created invoice.
   */
  createInvoice(IInvoice: IInvoice): Observable<IInvoice> {
    return this.http.post<IInvoice>(this.apiUrl, IInvoice).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get all invoices.
   * @returns An observable of an array of InvoiceDto objects.
   */
  getAllInvoices(): Observable<IInvoice[]> {
    return this.http.get<IInvoice[]>(this.apiUrl).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get an invoice by its ID.
   * @param id The ID of the invoice.
   * @returns An observable of a single InvoiceDto object.
   */
  getInvoiceById(id: number): Observable<IInvoice> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<IInvoice>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Update an existing invoice.
   * @param id The ID of the invoice to update.
   * @param IInvoice The updated invoice details in DTO format.
   * @returns An observable of the updated InvoiceDto object.
   */
  updateInvoice(id: number, IInvoice: IInvoice): Observable<IInvoice> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<IInvoice>(url, IInvoice).pipe(
      this.handleResponse()
    );
  }

  /**
   * Delete an invoice by its ID.
   * @param id The ID of the invoice to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  deleteInvoice(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get invoices by supplier ID.
   * @param supplierID The ID of the supplier.
   * @returns An observable of an array of InvoiceDto objects.
   */
  getInvoicesBySupplierId(supplierID: number): Observable<IInvoice[]> {
    const url = `${this.apiUrl}/supplier/${supplierID}`;
    return this.http.get<IInvoice[]>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get invoices by vehicle ID.
   * @param vehicleID The ID of the vehicle.
   * @returns An observable of an array of InvoiceDto objects.
   */
  getInvoicesByVehicleId(vehicleID: number): Observable<IInvoice[]> {
    const url = `${this.apiUrl}/vehicle/${vehicleID}`;
    return this.http.get<IInvoice[]>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Get overdue invoices.
   * @returns An observable of an array of InvoiceDto objects.
   */
  getOverdueInvoices(): Observable<IInvoice[]> {
    const url = `${this.apiUrl}/overdue`;
    return this.http.get<IInvoice[]>(url).pipe(
      this.handleResponse()
    );
  }

  /**
   * Handle HTTP response and errors.
   */
  private handleResponse<T>() {
    return (source: Observable<T>) => source.pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error:', error);
        return throwError(() => new Error(error.message || 'An unknown error occurred'));
      }),
      map((response: any) => {
        console.log('Response:', response);
        return response;
      })
    );
  }
}