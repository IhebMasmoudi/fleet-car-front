import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ISupplier } from 'src/app/interfaces/ISupplier';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-supplier-details-dialog',
  template: `
    <h2 mat-dialog-title>Supplier Details</h2>
    <mat-dialog-content>
      <p><strong>Name:</strong> {{ data.name }}</p>
      <p><strong>Contact Info:</strong> {{ data.contactInfo }}</p>
      <p><strong>Services Offered:</strong> {{ data.servicesOffered }}</p>
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
export class SupplierDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ISupplier) {}
}