import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CarsService } from 'src/app/services/Cars.service';
import { DocumentService } from 'src/app/services/document.service';
import { ICars } from 'src/app/interfaces/ICars';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

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
    MatMenuModule
  ],
})
export class CarsComponent implements OnInit {
  cars: ICars[] = [];
  displayedColumns: string[] = ['id', 'model', 'brand', 'licensePlate', 'year', 'fuelType', 'mileage', 'status', 'type', 'actions'];
  carForm: FormGroup;
  isEditing = false;
  showForm = false;

  constructor(
    private carsService: CarsService, 
    private fb: FormBuilder, 
    private router: Router,
    private documentService: DocumentService  // Inject DocumentService
  ) {
    this.carForm = this.fb.group({
      id: [null],
      model: ['', Validators.required],
      brand: ['', Validators.required],
      licensePlate: ['', Validators.required],
      year: [0, Validators.required],
      fuelType: ['', Validators.required],
      mileage: [0, Validators.required],
      status: ['', Validators.required],
      type: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchCars();
  }

  /**
   * Fetch all cars from the server.
   */
  fetchCars(): void {
    this.carsService.getAllVehicles().subscribe(
      (cars) => {
        this.cars = cars;
      },
      (error) => {
        console.error('Error fetching cars:', error);
      }
    );
  }

  /**
   * Open the form in "add" mode.
   */
  openAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.carForm.reset();
  }

  /**
   * Open the form in "edit" mode for the selected car.
   * @param car The car to edit.
   */
  startEdit(car: ICars): void {
    this.carForm.patchValue(car);
    this.isEditing = true;
    this.showForm = true;
  }

  /**
   * Add a new car.
   */
  addCar(): void {
    if (this.carForm.invalid) return;
    this.carsService.createVehicle(this.carForm.value).subscribe(
      (car) => {
        this.cars.push(car);
        alert('Car added successfully!');
        this.closeForm();
      },
      (error) => {
        console.error('Error adding car:', error);
        alert('Failed to add car.');
      }
    );
  }

  /**
   * Save the edited car.
   */
  saveEditedCar(): void {
    if (this.carForm.invalid) return;
    this.carsService.updateVehicle(this.carForm.value.id, this.carForm.value).subscribe(
      () => {
        const index = this.cars.findIndex((car) => car.id === this.carForm.value.id);
        if (index !== -1) {
          this.cars[index] = this.carForm.value;
        }
        alert('Car updated successfully!');
        this.closeForm();
      },
      (error) => {
        console.error('Error updating car:', error);
        alert('Failed to update car.');
      }
    );
  }

  /**
   * Delete a car by ID.
   * @param id The ID of the car to delete.
   */
  deleteCar(id: number): void {
    if (!confirm('Are you sure you want to delete this car?')) return;
    this.carsService.deleteVehicle(id).subscribe(
      () => {
        this.cars = this.cars.filter((car) => car.id !== id);
        alert('Car deleted successfully!');
      },
      (error) => {
        console.error('Error deleting car:', error);
        alert('Failed to delete car.');
      }
    );
  }

  /**
   * Navigate to the car details page.
   * @param id The ID of the car to view details.
   */
  seeDetails(id: number): void {
    this.router.navigate(['/extra/CarDetaills', id]);
  }

  /**
   * Upload a document or photo for the car.
   * This method creates a hidden file input, lets the user choose a file,
   * and then uploads it using the DocumentService.
   * @param carId The ID of the car.
   */
  uploadDocument(carId: number): void {
    // Create a hidden file input element
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = '.png,.jpg,.jpeg,.pdf'; // adjust as needed

    // When a file is selected...
    inputElement.onchange = (event: any) => {
      const file: File = event.target.files[0];
      if (file) {
        // Ask for additional details (you could replace these with a proper form/dialog)
        const documentName = prompt('Enter Document Name:', 'Document');
        const documentType = prompt('Enter Document Type:', 'Photo'); // or "Document"

        if (documentName && documentType) {
          this.documentService.uploadDocument(carId, documentName, documentType, file).subscribe(
            (response) => {
              alert('Document uploaded successfully!');
            },
            (error) => {
              console.error('Error uploading document:', error);
              alert('Failed to upload document.');
            }
          );
        }
      }
    };

    // Trigger the file dialog
    inputElement.click();
  }

  /**
   * Hide the form and display the list view.
   */
  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
  }

  /**
   * TrackBy function for the table or card rows.
   */
  trackByCarId(index: number, car: ICars): number | undefined {
    return car.id;
  }
}
