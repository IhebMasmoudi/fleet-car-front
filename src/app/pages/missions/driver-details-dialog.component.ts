import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { IDriver } from 'src/app/interfaces/IDriver';
@Component({
  selector: 'app-driver-details-dialog',
  template: `
    <h2 mat-dialog-title>Driver Details</h2>
    <mat-dialog-content>
      <p><strong>License Number:</strong> {{ data.phoneNumber }}</p>
      <p><strong>Phone:</strong> {{ data.status }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Close</button>
    </mat-dialog-actions>
  `,
    imports: [
      MatDialogModule
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
