// cars.component.ts
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, finalize } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-cars',
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
    MatSnackBarModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './cars.component.html',
  styleUrls: ['./cars.component.scss']
})
export class CarsComponent implements OnInit {
  cars: ICars[] = [];
  carForm: FormGroup;
  isEditing = false;
  showForm = false;
  showDocuments = false;
  selectedCarId: number | null = null;
  documents: Document[] = [];
  documentColumns: string[] = ['id', 'documentName', 'documentType', 'actions'];

  // Filter properties
  filterBrand: string = '';
  filterModel: string = '';
  filterLicensePlate: string = '';
  filterMinYear: number | null = null;
  filterMaxYear: number | null = null;
  filterStatus: string = '';
  filterType: string = '';
  sortBrandAsc: boolean = true;
  availableStatuses: string[] = ['All', 'Available', 'In Use', 'Under Maintenance'];
  availableTypes: string[] = ['All', 'Sedan', 'SUV', 'Hatchback', 'Truck', 'Van'];

  loading = false;

  constructor(
    private carsService: CarsService,
    private fb: FormBuilder,
    private router: Router,
    private documentService: DocumentService,
    private snackBar: MatSnackBar
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
      photoUrl: [null] // Optional field for photo URL
    });
  }

  fetchCars(): void {
    this.loading = true;
    this.carsService.getAllVehicles()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (cars) => {
          this.cars = cars.map(car => ({ ...car, loadingPhoto: false }));
          this.loadCarPhotos();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error fetching cars:', error);
          this.showNotification('Failed to load cars', 'error');
        }
      });
  }

  private loadCarPhotos(): void {
    const photoRequests = this.cars.map(car =>
      this.documentService.getDocumentsByVehicleId(car.id!)
        .pipe(
          switchMap(documents => {
            const photoDoc = documents.find(doc => doc.documentName.toLowerCase() === 'photo');
            if (!photoDoc) return of(null);
            return this.documentService.downloadDocument(car.id!, photoDoc.documentName)
              .pipe(map((blob: Blob) => ({ carId: car.id!, blob })));
          }),
          finalize(() => car.loadingPhoto = false)
        )
    );

    forkJoin(photoRequests).subscribe({
      next: (results) => {
        results.forEach(result => {
          if (result) {
            const car = this.cars.find(c => c.id === result.carId);
            if (car) car.photoUrl = URL.createObjectURL(result.blob);
          }
        });
      },
      error: (error) => console.error('Error loading car photos:', error)
    });
  }

  openAddForm(): void {
    this.showForm = true;
    this.showDocuments = false;
    this.isEditing = false;
    this.carForm.reset({ year: new Date().getFullYear(), mileage: 0 });
  }

  startEdit(car: ICars): void {
    this.carForm.patchValue(car);
    this.isEditing = true;
    this.showForm = true;
    this.showDocuments = false;
  }

  addCar(): void {
    if (this.carForm.invalid) return;
    this.loading = true;
    this.carsService.createVehicle(this.carForm.value)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (car) => {
          this.cars.push(car);
          this.closeForm();
          this.applyFilters();
          this.showNotification('Car added successfully!', 'success');
        },
        error: (error) => {
          console.error('Error adding car:', error);
          this.showNotification('Failed to add car', 'error');
        }
      });
  }

  saveEditedCar(): void {
    if (this.carForm.invalid) return;
    this.loading = true;
    const carId = this.carForm.value.id;
    this.carsService.updateVehicle(carId, this.carForm.value)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          const index = this.cars.findIndex(car => car.id === carId);
          if (index !== -1) this.cars[index] = { ...this.carForm.value };
          this.closeForm();
          this.applyFilters();
          this.showNotification('Car updated successfully!', 'success');
        },
        error: (error) => {
          console.error('Error updating car:', error);
          this.showNotification('Failed to update car', 'error');
        }
      });
  }

  deleteCar(id: number): void {
    if (!confirm('Are you sure you want to delete this car?')) return;
    this.loading = true;
    this.carsService.deleteVehicle(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.cars = this.cars.filter(car => car.id !== id);
          this.applyFilters();
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

  applyFilters(): void {
    let filteredData = [...this.cars];

    if (this.filterBrand) {
      filteredData = filteredData.filter(car => 
        car.brand.toLowerCase().includes(this.filterBrand.toLowerCase())
      );
    }

    if (this.filterModel) {
      filteredData = filteredData.filter(car => 
        car.model.toLowerCase().includes(this.filterModel.toLowerCase())
      );
    }

    if (this.filterLicensePlate) {
      filteredData = filteredData.filter(car => 
        car.licensePlate.toLowerCase().includes(this.filterLicensePlate.toLowerCase())
      );
    }

    if (this.filterMinYear !== null) {
      filteredData = filteredData.filter(car => car.year >= this.filterMinYear!);
    }
    if (this.filterMaxYear !== null) {
      filteredData = filteredData.filter(car => car.year <= this.filterMaxYear!);
    }

    if (this.filterStatus && this.filterStatus !== 'All') {
      filteredData = filteredData.filter(car => 
        car.status.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }

    if (this.filterType && this.filterType !== 'All') {
      filteredData = filteredData.filter(car => 
        car.type.toLowerCase() === this.filterType.toLowerCase()
      );
    }

    filteredData.sort((a, b) => 
      this.sortBrandAsc ? a.brand.localeCompare(b.brand) : b.brand.localeCompare(a.brand)
    );

    this.cars = filteredData;
  }

  resetFilters(): void {
    this.filterBrand = '';
    this.filterModel = '';
    this.filterLicensePlate = '';
    this.filterMinYear = null;
    this.filterMaxYear = null;
    this.filterStatus = '';
    this.filterType = '';
    this.fetchCars();
  }

  toggleBrandSort(): void {
    this.sortBrandAsc = !this.sortBrandAsc;
    this.applyFilters();
  }

  uploadDocument(carId: number): void {
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = '.png,.jpg,.jpeg,.pdf';

    inputElement.onchange = (event: any) => {
      const file: File = event.target.files[0];
      if (file) {
        const documentName = prompt('Enter Document Name:', file.name.split('.')[0] || 'Document') || '';
        const documentType = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        
        if (documentName) {
          this.loading = true;
          this.documentService.uploadDocument(carId, documentName, documentType, file)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
              next: () => {
                this.showNotification('Document uploaded successfully!', 'success');
                if (this.showDocuments && this.selectedCarId === carId) {
                  this.fetchDocumentsForCar(carId);
                }
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
        next: (documents) => this.documents = documents,
        error: (error) => this.showNotification('Failed to load documents', 'error')
      });
  }

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
        error: (error) => this.showNotification('Failed to download document', 'error')
      });
  }

  viewDocument(vehicleID: number, documentName: string): void {
    this.loading = true;
    this.documentService.downloadDocument(vehicleID, documentName)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (error) => this.showNotification('Failed to view document', 'error')
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
          this.fetchCars(); // Refresh in case a photo was deleted
        },
        error: (error) => this.showNotification('Failed to delete document', 'error')
      });
  }

  closeDocuments(): void {
    this.showDocuments = false;
    this.selectedCarId = null;
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}