import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ICars } from 'src/app/interfaces/ICars';

@Component({
  selector: 'app-car-details-dialog',
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Vehicle Details</h2>
      <button mat-icon-button (click)="onClose()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="vehicle-header">
        <div class="vehicle-title">{{ data.brand }} {{ data.model }}</div>
        <div class="vehicle-plate">{{ data.licensePlate }}</div>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">
            <mat-icon>calendar_today</mat-icon>
            <span>Year</span>
          </div>
          <div class="info-value">{{ data.year }}</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <mat-icon>local_gas_station</mat-icon>
            <span>Fuel Type</span>
          </div>
          <div class="info-value">{{ data.fuelType }}</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <mat-icon>speed</mat-icon>
            <span>Mileage</span>
          </div>
          <div class="info-value">{{ data.mileage }} km</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <mat-icon>category</mat-icon>
            <span>Type</span>
          </div>
          <div class="info-value">{{ data.type }}</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <mat-icon>verified</mat-icon>
            <span>Status</span>
          </div>
          <div class="info-value">
            <span class="status-badge" [ngClass]="{
              'available': data.status === 'Available',
              'in-use': data.status === 'In Use',
              'maintenance': data.status === 'Maintenance'
            }">{{ data.status }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="onClose()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }
    
    .close-button {
      margin-right: -12px;
    }
    
    .dialog-content {
      padding: 24px;
      max-height: 70vh;
    }
    
    .vehicle-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .vehicle-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }
    
    .vehicle-plate {
      font-size: 1rem;
      color: #555;
      margin-top: 4px;
      background-color: #f5f5f5;
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .info-item {
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    
    .info-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #555;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .info-value {
      font-size: 1rem;
      color: #333;
    }
    
    .status-badge {
      padding: 6px 12px;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 500;
      display: inline-block;
      text-align: center;
    }
    
    .available {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .in-use {
      background-color: #e0f7fa;
      color: #00838f;
    }
    
    .maintenance {
      background-color: #fff8e1;
      color: #ffa000;
    }
  `],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    CommonModule
  ]
})
export class CarDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CarDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ICars
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}