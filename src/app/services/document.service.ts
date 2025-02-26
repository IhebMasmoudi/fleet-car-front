import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Document } from '../interfaces/IDocument';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = 'http://localhost:8080/api/documents'; // Adjust according to backend URL

  constructor(private http: HttpClient) {}

  // Upload Document
  uploadDocument(vehicleId: number, documentName: string, documentType: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('documentName', documentName);
    formData.append('documentType', documentType);
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload/${vehicleId}`, formData, { responseType: 'text' });
  }

  // Get Documents by Vehicle ID
  getDocumentsByVehicleId(vehicleId: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/vehicle/${vehicleId}`);
  }

  // Download Document
  downloadDocument(vehicleId: number, documentName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${vehicleId}/${documentName}`, {
      responseType: 'blob'
    });
  }

  // Update Document
  updateDocument(documentId: number, document: Document): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/${documentId}`, document);
  }

  // Delete Document
  deleteDocument(documentId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${documentId}`);
  }
}
