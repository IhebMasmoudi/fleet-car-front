import { Component, OnInit } from '@angular/core';
import { IParkingSlot, ExtendedParkingSlot } from '../../interfaces/IParkingSlot';
import { ParkingSlotsService } from '../../services/ParkingSlot.Service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CarsService } from '../../services/Cars.service';
import { ICars } from '../../interfaces/ICars';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-parkingslot',
  imports: [
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './parkingslot.component.html',
  styleUrls: ['./parkingslot.component.scss']
})
export class ParkingslotComponent implements OnInit {
  cars: ICars[] = [];
  parkingSlots: ExtendedParkingSlot[] = [];
  errorMessage: string = '';

  // For adding a new parking slot.
  showAddForm: boolean = false;
  newParkingSlotLocation: string = '';

  constructor(
    private parkingSlotsService: ParkingSlotsService,
    private carsService: CarsService
  ) {}

  ngOnInit(): void {
    this.fetchParkingSlots();
    this.fetchCars();
  }

  // Fetch all cars from the backend.
  fetchCars(): void {
    this.carsService.getAllVehicles().subscribe(
      (cars) => {
        this.cars = cars;
        console.log('Fetched cars:', cars);
      },
      (error) => {
        console.error('Error fetching cars:', error);
      }
    );
  }

  // Fetch all parking slots.
  fetchParkingSlots(): void {
    this.parkingSlotsService.getAllParkingSlots().subscribe({
      next: (slots: IParkingSlot[]) => {
        // Extend each slot with UI flags.
        this.parkingSlots = slots.map(slot => ({
          ...slot,
          editMode: false,
          // Initialize selectedCarId to the current assignment (or null).
          selectedCarId: slot.assignedVehicleID ? slot.assignedVehicleID : null
        }));
        console.log('Fetched parking slots:', this.parkingSlots);
      },
      error: (err) => {
        console.error('Error fetching parking slots:', err);
        this.errorMessage = 'Error fetching parking slots.';
      }
    });
  }

  // Toggle the Add Slot form.
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newParkingSlotLocation = '';
    }
  }

  // Add a new parking slot. Note: status is "Available" and no car is assigned.
  addParkingSlot(): void {
    if (!this.newParkingSlotLocation.trim()) {
      alert('Please enter a location.');
      return;
    }
    const newSlot: IParkingSlot = {
      location: this.newParkingSlotLocation,
      status: 'Available',
      assignedVehicleID: null
    };
    console.log('Adding new parking slot:', newSlot);
    this.parkingSlotsService.createParkingSlot(newSlot).subscribe({
      next: (createdSlot: IParkingSlot) => {
        console.log('API response for adding parking slot:', createdSlot);
        this.newParkingSlotLocation = '';
        this.showAddForm = false;
        this.fetchParkingSlots();
        alert('Parking slot added successfully!');
      },
      error: (err) => {
        console.error('Error adding parking slot:', err);
        alert('Failed to add parking slot.');
      }
    });
  }

  // Called when a free slot's "Reserve" button is clicked.
  enableReservation(slot: ExtendedParkingSlot): void {
    slot.editMode = true;
  }

  // Confirm reservation after selecting a car.
  confirmReservation(slot: ExtendedParkingSlot): void {
    if (!slot.selectedCarId) {
      alert('Please select a car before reserving.');
      return;
    }
    const updatedSlot: IParkingSlot = {
      ...slot,
      status: 'Reserved',
      assignedVehicleID: slot.selectedCarId
    };
    console.log('Reserving slot with data:', updatedSlot);
    this.parkingSlotsService.updateParkingSlot(slot.id!, updatedSlot).subscribe({
      next: (resSlot: IParkingSlot) => {
        console.log('API response for reservation:', resSlot);
        this.fetchParkingSlots();
        alert('Slot reserved successfully!');
      },
      error: (err) => {
        console.error('Error reserving slot:', err);
        alert('Failed to reserve the slot.');
      }
    });
  }

  // Reset a reserved slot so it becomes available again.
  resetSlot(slot: ExtendedParkingSlot): void {
    const updatedSlot: IParkingSlot = {
      ...slot,
      status: 'Available',
      assignedVehicleID: null
    };
    console.log('Resetting slot with data:', updatedSlot);
    this.parkingSlotsService.updateParkingSlot(slot.id!, updatedSlot).subscribe({
      next: (resSlot: IParkingSlot) => {
        console.log('API response for reset:', resSlot);
        this.fetchParkingSlots();
        alert('Slot reset successfully!');
      },
      error: (err) => {
        console.error('Error resetting slot:', err);
        alert('Failed to reset the slot.');
      }
    });
  }

  // Utility method to get a car's model from its ID.
  getCarModel(carId: number | null): string {
    if (!carId) return '';
    const car = this.cars.find(c => c.id === carId);
    return car ? car.model : '';
  }
}
