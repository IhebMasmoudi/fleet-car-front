import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { IDriver } from 'src/app/interfaces/IDriver';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-driver-details-dialog',
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Driver Details</h2>
      <button mat-icon-button (click)="onClose()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="info-row">
        <div class="info-label">
          <mat-icon>badge</mat-icon>
          <span>License Number</span>
        </div>
        <div class="info-value">{{ data.licenseNumber || 'N/A' }}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">
          <mat-icon>phone</mat-icon>
          <span>Phone Number</span>
        </div>
        <div class="info-value">{{ data.phoneNumber || 'N/A' }}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">
          <mat-icon>verified_user</mat-icon>
          <span>Status</span>
        </div>
        <div class="info-value">
          <span class="status-badge" [ngClass]="{
            'active': data.status === 'Active',
            'suspended': data.status === 'Suspended'
          }">{{ data.status }}</span>
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
    
    .info-row {
      display: flex;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .info-label {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #555;
      font-weight: 500;
    }
    
    .info-value {
      flex: 2;
      font-size: 1rem;
    }
    
    .status-badge {
      padding: 6px 12px;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 500;
      display: inline-block;
      text-align: center;
    }
    
    .active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .suspended {
      background-color: #ffebee;
      color: #c62828;
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
export class DriverDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DriverDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IDriver
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
