import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ICars} from 'src/app/interfaces/ICars';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-supplier-details-dialog',
  template: `
   <h2 mat-dialog-title>Car Details</h2>
    <mat-dialog-content>
      <p><strong>Model:</strong> {{ data.model }}</p>
      <p><strong>Brand:</strong> {{ data.brand }}</p>
      <p><strong>License Plate:</strong> {{ data.licensePlate }}</p>
      <p><strong>Year:</strong> {{ data.year }}</p>
      <p><strong>Fuel Type:</strong> {{ data.fuelType }}</p>
      <p><strong>Mileage:</strong> {{ data.mileage }}</p>
      <p><strong>Status:</strong> {{ data.status }}</p>
      <p><strong>Type:</strong> {{ data.type }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class CarDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ICars) {}
}