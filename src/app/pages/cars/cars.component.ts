import { Component, OnInit } from '@angular/core';
import { CarsService } from '../../services/Cars.service';
import { ICars } from '../../interfaces/ICars';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

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
    FormsModule,
    CommonModule,
    MatIconModule,
  ],
})
export class CarsComponent implements OnInit {
  cars: ICars[] = [];
  displayedColumns: string[] = ['id', 'model', 'brand', 'licensePlate', 'year', 'fuelType', 'mileage', 'status', 'type', 'actions'];
  newCar: ICars = {
    id: undefined,
    model: '',
    brand: '',
    licensePlate: '',
    year: 0,
    fuelType: '',
    mileage: 0,
    status: '',
    type: '',
    
  };
  editedCar: ICars = {
    id: undefined,
    model: '',
    brand: '',
    licensePlate: '',
    year: 0,
    fuelType: '',
    mileage: 0,
    status: '',
    type: '',
   
  };
  isEditing = false;
  showForm = false;

  constructor(private carsService: CarsService) {}

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
    this.newCar = {
      id: undefined,
      model: '',
      brand: '',
      licensePlate: '',
      year: 0,
      fuelType: '',
      mileage: 0,
      status: '',
      type: '',
     
    };
  }

  /**
   * Open the form in "edit" mode for the selected car.
   * @param car The car to edit.
   */
  startEdit(car: ICars): void {
    this.editedCar = { ...car };
    this.isEditing = true;
    this.showForm = true;
  }

  /**
   * Add a new car.
   */
  addCar(): void {
    if (!this.newCar.model.trim() || this.newCar.year === 0) return;
    this.carsService.createVehicle(this.newCar).subscribe(
      (car) => {
        this.cars.push(car);
        this.newCar = {
          id: undefined,
          model: '',
          brand: '',
          licensePlate: '',
          year: 0,
          fuelType: '',
          mileage: 0,
          status: '',
          type: '',
         
        };
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
    if (!this.editedCar.model.trim() || this.editedCar.year === 0) return;
    this.carsService.updateVehicle(this.editedCar.id!, this.editedCar).subscribe(
      () => {
        const index = this.cars.findIndex((car) => car.id === this.editedCar.id);
        if (index !== -1) {
          this.cars[index] = this.editedCar;
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
   * Cancel the current form action.
   */
  cancelEdit(): void {
    this.closeForm();
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
   * Hide the form and display the table.
   */
  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
  }
}