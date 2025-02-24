import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Document } from '../interfaces/IDocument';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = 'http://localhost:8080/api/documents'; // Backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Upload a document for a specific vehicle.
   * @param vehicleId The ID of the vehicle.
   * @param documentName The name of the document.
   * @param documentType The type of the document.
   * @param file The file to upload.
   * @returns An observable of the upload response.
   */
  uploadDocument(vehicleId: number, documentName: string, documentType: string, file: File): Observable<string> {
    const formData: FormData = new FormData();
    formData.append('documentName', documentName);
    formData.append('documentType', documentType);
    formData.append('file', file);

    const url = `${this.apiUrl}/upload/${vehicleId}`;
    return this.http.post<string>(url, formData);
  }

  /**
   * Get all documents for a specific vehicle.
   * @param vehicleId The ID of the vehicle.
   * @returns An observable of the list of documents.
   */
  getDocumentsByVehicleId(vehicleId: number): Observable<Document[]> {
    const url = `${this.apiUrl}/vehicle/${vehicleId}`;
    return this.http.get<Document[]>(url);
  }

  /**
   * Download a document for a specific vehicle.
   * @param vehicleId The ID of the vehicle.
   * @param documentName The name of the document.
   * @returns An observable of the document data.
   */
  downloadDocument(vehicleId: number, documentName: string): Observable<Blob> {
    const url = `${this.apiUrl}/download/${vehicleId}/${documentName}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Update a document.
   * @param documentId The ID of the document.
   * @param updatedDocument The updated document data.
   * @returns An observable of the update response.
   */
  updateDocument(documentId: number, updatedDocument: Document): Observable<string> {
    const url = `${this.apiUrl}/${documentId}`;
    return this.http.put<string>(url, updatedDocument);
  }

  /**
   * Delete a document.
   * @param documentId The ID of the document.
   * @returns An observable of the delete response.
   */
  deleteDocument(documentId: number): Observable<string> {
    const url = `${this.apiUrl}/${documentId}`;
    return this.http.delete<string>(url);
  }
}