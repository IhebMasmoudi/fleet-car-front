// src/app/services/query.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Import the interfaces
import { ApiQueryRequest, ApiQueryResponse, ApiErrorResponse } from '../interfaces/ChatAi';

@Injectable({
  providedIn: 'root'
})
export class ChatAIService {

  private apiUrl = 'http://localhost:5000/api/query'; // Or your deployed backend URL

  constructor(private http: HttpClient) { }

  /**
   * Sends a natural language query to the backend.
   * @param query The natural language query string.
   * @returns An Observable emitting the ApiQueryResponse on success.
   */
  sendQuery(query: string): Observable<ApiQueryResponse> {
    const requestPayload: ApiQueryRequest = {
      user_query: query
    };

    // Make the POST request, specifying the expected response type <ApiQueryResponse>
    return this.http.post<ApiQueryResponse>(this.apiUrl, requestPayload)
      .pipe(
        catchError(this.handleError) // Add error handling
      );
  }

  /**
   * Basic error handling for HTTP requests.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      // Try to parse the backend's error response
      const errorResponse = error.error as ApiErrorResponse; // Cast to potential error shape
      if (errorResponse && errorResponse.error) {
          errorMessage = `Server error (${error.status}): ${errorResponse.error}`;
      } else {
          errorMessage = `Server returned status ${error.status}, error body: ${JSON.stringify(error.error)}`;
      }
    }
    console.error(errorMessage);
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later. Details logged to console.'));
  }
}