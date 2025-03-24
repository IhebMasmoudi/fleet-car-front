// tn.pi.fleet_car.front-angular19/src/app/services/insurance.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Insurance } from '../interfaces/IInsurance';

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {

  private apiUrl = 'http://localhost:8080/api/insurances'; 

  constructor(private http: HttpClient) { }

  getAllInsurances(): Observable<Insurance[]> {
    return this.http.get<Insurance[]>(this.apiUrl);
  }

  getInsuranceById(id: number): Observable<Insurance> {
    return this.http.get<Insurance>(`${this.apiUrl}/${id}`);
  }

  createInsurance(insurance: Insurance): Observable<Insurance> {
    return this.http.post<Insurance>(this.apiUrl, insurance);
  }

  updateInsurance(id: number, insurance: Insurance): Observable<Insurance> {
    return this.http.put<Insurance>(`${this.apiUrl}/${id}`, insurance);
  }

  deleteInsurance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}