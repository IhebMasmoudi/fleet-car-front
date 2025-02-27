import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CarsService } from 'src/app/services/Cars.service';
import { DocumentService } from 'src/app/services/document.service';
import { ICars } from 'src/app/interfaces/ICars';
import { Document } from 'src/app/interfaces/IDocument';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { forkJoin, finalize } from 'rxjs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
@Component({
  selector: 'app-cars',
  templateUrl: './cars.component.html',
  styleUrls: ['./cars.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatStepperModule,
    MatOptionModule,
    MatSelectModule
  ],
})
export class CarsComponent implements OnInit {
  // Cars data
  cars: ICars[] = [];
  displayedColumns: string[] = ['id', 'model', 'brand', 'licensePlate', 'year', 'fuelType', 'mileage', 'status', 'type', 'actions'];
  carForm: FormGroup;
  isEditing = false;
  showForm = false;
  
  // Documents data
  documents: Document[] = [];
  documentColumns: string[] = ['id', 'documentName', 'documentType', 'actions'];
  showDocuments = false;
  selectedCarId: number | null = null;
  
  // Loading states
  loading = false;
  addingCar = false;
  editingCar = false;
  deletingCar = false;
  uploadingDocument = false;
  viewCarId: number | null = null;

  constructor(
    private carsService: CarsService, 
    private fb: FormBuilder, 
    private router: Router,
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.fetchCars();
  }

  private initializeForm(): void {
    this.carForm = this.fb.group({
      id: [null],
      model: ['', Validators.required],
      brand: ['', Validators.required],
      licensePlate: ['', [Validators.required, Validators.pattern('[A-Z0-9-]+')]],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1950), Validators.max(new Date().getFullYear() + 1)]],
      fuelType: ['', Validators.required],
      mileage: [0, [Validators.required, Validators.min(0)]],
      status: ['', Validators.required],
      type: ['', Validators.required],
    });
  }

  // ------------------------------------------------------------------------------------
  // Cars Methods
  // ------------------------------------------------------------------------------------
  fetchCars(): void {
    this.loading = true;
    this.carsService.getAllVehicles()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (cars) => { 
          this.cars = cars;
          this.loadCarPhotos();
        },
        error: (error) => {
          console.error('Error fetching cars:', error);
          this.showNotification('Failed to load cars', 'error');
        }
      });
  }
  
  private loadCarPhotos(): void {
    if (!this.cars || this.cars.length === 0) return;
    
    const documentRequests = this.cars.map(car => 
      this.documentService.getDocumentsByVehicleId(car.id!)
    );
    
    forkJoin(documentRequests).subscribe({
      next: (documentsArray) => {
        this.cars.forEach((car, index) => {
          const documents = documentsArray[index];
          if (!documents || documents.length === 0) return;
          
          const photoDoc = documents.find(doc => 
            doc.documentName.toLowerCase() === 'photo'
          );
          
          if (photoDoc) {
            this.documentService.downloadDocument(car.id!, photoDoc.documentName)
              .subscribe(blob => {
                car.photoUrl = URL.createObjectURL(blob);
              });
          }
        });
      },
      error: (error) => {
        console.error('Error loading car photos:', error);
      }
    });
  }

  openAddForm(): void {
    this.showForm = true;
    this.showDocuments = false;
    this.isEditing = false;
    this.carForm.reset({
      year: new Date().getFullYear(),
      mileage: 0
    });
  }

  startEdit(car: ICars): void {
    this.carForm.patchValue(car);
    this.isEditing = true;
    this.showForm = true;
    this.showDocuments = false;
  }

  addCar(): void {
    if (this.carForm.invalid) return;
    
    this.addingCar = true;
    this.carsService.createVehicle(this.carForm.value)
      .pipe(finalize(() => this.addingCar = false))
      .subscribe({
        next: (car) => {
          this.cars.push(car);
          this.showNotification('Car added successfully!', 'success');
          this.closeForm();
          this.fetchCars(); // Refresh to ensure consistency
        },
        error: (error) => {
          console.error('Error adding car:', error);
          this.showNotification('Failed to add car', 'error');
        }
      });
  }

  saveEditedCar(): void {
    if (this.carForm.invalid) return;
    
    this.editingCar = true;
    const carId = this.carForm.value.id;
    
    this.carsService.updateVehicle(carId, this.carForm.value)
      .pipe(finalize(() => this.editingCar = false))
      .subscribe({
        next: () => {
          const index = this.cars.findIndex(car => car.id === carId);
          if (index !== -1) { 
            this.cars[index] = this.carForm.value; 
          }
          this.showNotification('Car updated successfully!', 'success');
          this.closeForm();
          this.fetchCars(); // Refresh to ensure consistency
        },
        error: (error) => {
          console.error('Error updating car:', error);
          this.showNotification('Failed to update car', 'error');
        }
      });
  }

  deleteCar(id: number): void {
    if (!confirm('Are you sure you want to delete this car?')) return;
    
    this.deletingCar = true;
    this.viewCarId = id;
    
    this.carsService.deleteVehicle(id)
      .pipe(finalize(() => {
        this.deletingCar = false;
        this.viewCarId = null;
      }))
      .subscribe({
        next: () => {
          this.cars = this.cars.filter(car => car.id !== id);
          this.showNotification('Car deleted successfully!', 'success');
        },
        error: (error) => {
          console.error('Error deleting car:', error);
          this.showNotification('Failed to delete car', 'error');
        }
      });
  }

  seeDetails(id: number): void {
    this.router.navigate(['/extra/CarDetaills', id]);
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
  }

  trackByCarId(index: number, car: ICars): number | undefined {
    return car.id;
  }

  // -------------------------
  // Documents Methods
  // -------------------------
  uploadDocument(carId: number): void {
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = '.png,.jpg,.jpeg,.pdf';

    inputElement.onchange = (event: any) => {
      const file: File = event.target.files[0];
      if (file) {
        const documentName = prompt('Enter Document Name:', file.name.split('.')[0] || 'Document');
        const documentType = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        
        if (documentName) {
          this.uploadingDocument = true;
          this.viewCarId = carId;
          
          this.documentService.uploadDocument(carId, documentName, documentType, file)
            .pipe(finalize(() => {
              this.uploadingDocument = false;
              this.viewCarId = null;
            }))
            .subscribe({
              next: () => {
                this.showNotification('Document uploaded successfully!', 'success');
                if (this.showDocuments && this.selectedCarId === carId) {
                  this.fetchDocumentsForCar(carId);
                }
                // If this is a photo document, refresh car list to show it
                if (documentName.toLowerCase() === 'photo') {
                  this.fetchCars();
                }
              },
              error: (error) => {
                console.error('Error uploading document:', error);
                this.showNotification('Failed to upload document', 'error');
              }
            });
        }
      }
    };
    inputElement.click();
  }

  viewDocuments(carId: number): void {
    this.selectedCarId = carId;
    this.showForm = false;
    this.showDocuments = true;
    this.fetchDocumentsForCar(carId);
  }

  fetchDocumentsForCar(carId: number): void {
    this.loading = true;
    this.documentService.getDocumentsByVehicleId(carId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (documents) => {
          this.documents = documents;
        },
        error: (error) => {
          console.error('Error fetching documents:', error);
          this.showNotification('Failed to load documents', 'error');
        }
      });
  }

  // Download Document
  downloadDocument(vehicleID: number, documentName: string): void {
    this.loading = true;
    this.documentService.downloadDocument(vehicleID, documentName)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = documentName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading document:', error);
          this.showNotification('Failed to download document', 'error');
        }
      });
  }

  // View Document: Open the file in a new tab/window
  viewDocument(vehicleID: number, documentName: string): void {
    this.loading = true;
    this.documentService.downloadDocument(vehicleID, documentName)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (error) => {
          console.error('Error viewing document:', error);
          this.showNotification('Failed to view document', 'error');
        }
      });
  }

  deleteDocument(documentId: number): void {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    this.loading = true;
    this.documentService.deleteDocument(documentId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.documents = this.documents.filter(doc => doc.id !== documentId);
          this.showNotification('Document deleted successfully!', 'success');
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          this.showNotification('Failed to delete document', 'error');
        }
      });
  }

  closeDocuments(): void {
    this.showDocuments = false;
    this.selectedCarId = null;
  }
  
  // Helper method for notifications
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}