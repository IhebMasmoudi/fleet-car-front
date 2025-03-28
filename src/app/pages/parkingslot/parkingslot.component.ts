import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Keep FormsModule for template-driven forms
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog'; // Keep if needed for car details later
import { MatTooltipModule } from '@angular/material/tooltip'; // Added for tooltips

import { Subject } from 'rxjs';
import { takeUntil, finalize, map } from 'rxjs/operators';

import { IParkingSlot, ExtendedParkingSlot } from '../../interfaces/IParkingSlot';
import { ICars } from '../../interfaces/ICars';
import { ParkingSlotsService } from '../../services/ParkingSlot.Service';
import { CarsService } from '../../services/Cars.service';

@Component({
  selector: 'app-parkingslot',
  standalone: true, // Ensure standalone is true
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatOptionModule,
    MatTooltipModule, // Import MatTooltipModule
    MatNativeDateModule // Needed for MatOptionModule potentially, though not directly used here
    
  ],
  templateUrl: './parkingslot.component.html',
  styleUrls: ['./parkingslot.component.scss'], // Use the modern SCSS
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParkingslotComponent implements OnInit, OnDestroy {

  // --- State Properties ---
  allParkingSlots: ExtendedParkingSlot[] = []; // Master list
  filteredParkingSlots: ExtendedParkingSlot[] = []; // Displayed list
  cars: ICars[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;         // Loading indicator for initial data fetching
  loadingActionSlotId: number | null = null; // ID of the slot being acted upon (reserve/reset)
  loadingAdd: boolean = false;         // Loading indicator for adding a slot
  showAddForm: boolean = false;
  filtersExpanded: boolean = false;
  // No 'isEditing' needed here as edits happen directly on the card

  // --- Form Fields for Adding ---
  newParkingSlotLocation: string = '';

  // --- Filter Properties ---
  filterLocation: string = '';
  filterStatus: 'Available' | 'Reserved' | '' = ''; // Filter by status
  filterVehicle: string = ''; // Filter by assigned vehicle (using getCarModel text)
  sortLocationAsc: boolean = true; // Sort by location

  // --- RxJS Subject for Unsubscribing ---
  private destroy$ = new Subject<void>();

  constructor(
    private parkingSlotsService: ParkingSlotsService,
    private carsService: CarsService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
    // private dialog: MatDialog // Inject if using dialogs
  ) {}

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.fetchCars();
    this.fetchParkingSlots();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Fetching ---
  fetchParkingSlots(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.parkingSlotsService.getAllParkingSlots()
      .pipe(
        takeUntil(this.destroy$),
        map((slots: IParkingSlot[]): ExtendedParkingSlot[] =>
          slots.map(slot => ({
            ...slot,
            editMode: false, // Initialize UI state
            selectedCarId: slot.assignedVehicleID // Pre-select if already assigned (though UI might hide selector)
          }))
        ),
        // Default sort can be added here if needed, e.g., by location
        map(extendedSlots => extendedSlots.sort((a, b) => a.location.localeCompare(b.location))),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (extendedSlots) => {
          this.allParkingSlots = extendedSlots;
          this.applyFilters(); // Apply filters which updates filteredParkingSlots
          console.log('Fetched and extended parking slots:', this.allParkingSlots);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching parking slots:', err);
          this.errorMessage = 'Error fetching parking slots data.';
          this.allParkingSlots = [];
          this.applyFilters(); // Clear display
          this.showNotification('Failed to load parking slots.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  fetchCars(): void {
    // No separate loading indicator for cars usually needed unless it blocks main UI
    this.carsService.getAllVehicles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cars) => {
          this.cars = cars;
          console.log('Fetched cars:', cars);
          // If filters depend on cars, might need to re-apply filters or update UI
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching cars:', error);
          this.showNotification('Failed to load vehicle list.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  // --- Form Handling & CRUD ---
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newParkingSlotLocation = ''; // Clear location when closing
      this.loadingAdd = false; // Ensure loading state is reset
    }
     // No resetForm needed as it's just one field
    this.cdr.markForCheck();
  }

  submitAddSlotForm(): void { // Renamed for clarity with form submission
    if (!this.newParkingSlotLocation.trim()) {
        this.showNotification('Please enter a location for the new slot.', 'error');
        return;
    }
    this.addParkingSlot();
  }

  addParkingSlot(): void {
    this.loadingAdd = true; // Set loading specific to adding
    this.cdr.markForCheck();

    const newSlotData: IParkingSlot = {
      location: this.newParkingSlotLocation.trim(),
      status: 'Available', // New slots are always available
      assignedVehicleID: null
    };

    this.parkingSlotsService.createParkingSlot(newSlotData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingAdd = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (createdSlot) => {
          // Add the new slot (extended) to the master list
          const newExtendedSlot: ExtendedParkingSlot = {
              ...createdSlot,
              editMode: false,
              selectedCarId: null
          };
          this.allParkingSlots.push(newExtendedSlot); // Add to master list
          // Optionally sort the master list again
          this.allParkingSlots.sort((a, b) => a.location.localeCompare(b.location));
          this.applyFilters(); // Update displayed list
          this.showAddForm = false; // Close form
          this.newParkingSlotLocation = ''; // Clear input
          this.showNotification('Parking slot added successfully!', 'success');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error adding parking slot:', err);
          this.showNotification('Failed to add parking slot.', 'error');
          // Keep form open on error? Optional.
        }
      });
  }

  // --- Slot Actions ---

  enableReservation(slot: ExtendedParkingSlot): void {
    // Close edit mode for all other slots first for cleaner UI
    this.allParkingSlots.forEach(s => s.editMode = false);
    slot.editMode = true;
    slot.selectedCarId = null; // Reset selection when opening
    this.cdr.markForCheck();
  }

  cancelReservationEdit(slot: ExtendedParkingSlot): void {
    slot.editMode = false;
    slot.selectedCarId = null; // Clear selection on cancel
    this.cdr.markForCheck();
  }

  confirmReservation(slot: ExtendedParkingSlot): void {
    if (!slot.selectedCarId) {
      this.showNotification('Please select a car to reserve the slot.', 'error');
      return;
    }

    this.loadingActionSlotId = slot.id!; // Set loading for this specific slot
    slot.editMode = false; // Optimistically close edit mode
    this.cdr.markForCheck();

    const updatedSlotData: IParkingSlot = { // Ensure all required fields are provided
      id: slot.id!,
      location: slot.location, // Use the existing location
      status: 'Reserved',
      assignedVehicleID: slot.selectedCarId
    };

    this.parkingSlotsService.updateParkingSlot(slot.id!, updatedSlotData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingActionSlotId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (updatedSlotFromServer) => {
           // Update the slot in the master list
          const index = this.allParkingSlots.findIndex(s => s.id === slot.id);
          if (index !== -1) {
              // Update master list with latest data and reset UI state
              this.allParkingSlots[index] = {
                  ...this.allParkingSlots[index], // Keep existing potentially unsaved UI state? No, use server data.
                  ...updatedSlotFromServer,
                  editMode: false, // Ensure edit mode is off
                  selectedCarId: updatedSlotFromServer.assignedVehicleID // Sync selected ID
              };
          }
          this.applyFilters(); // Refresh displayed list
          this.showNotification('Slot reserved successfully!', 'success');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error reserving slot:', err);
          this.showNotification('Failed to reserve the slot.', 'error');
          // Optionally re-enable edit mode on error?
          // slot.editMode = true;
          this.cdr.markForCheck();
        }
      });
  }

  resetSlot(slot: ExtendedParkingSlot): void {
     // Add confirmation dialog later if needed
     if (!confirm(`Are you sure you want to make slot "${slot.location}" available?`)) return;

    this.loadingActionSlotId = slot.id!; // Set loading for this specific slot
    this.cdr.markForCheck();

    const updatedSlotData: IParkingSlot = { // Ensure all required fields are provided
      id: slot.id!,
      location: slot.location, // Use the existing location
      status: 'Available',
      assignedVehicleID: null
    };

    this.parkingSlotsService.updateParkingSlot(slot.id!, updatedSlotData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingActionSlotId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (updatedSlotFromServer) => {
          // Update the slot in the master list
           const index = this.allParkingSlots.findIndex(s => s.id === slot.id);
           if (index !== -1) {
               this.allParkingSlots[index] = {
                   ...this.allParkingSlots[index],
                   ...updatedSlotFromServer,
                   editMode: false, // Ensure edit mode off
                   selectedCarId: null // Clear selected car
               };
           }
          this.applyFilters(); // Refresh displayed list
          this.showNotification('Slot reset successfully!', 'success');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error resetting slot:', err);
          this.showNotification('Failed to reset the slot.', 'error');
        }
      });
  }


  // --- Filtering & Sorting ---

  applyFilters(): void {
    let filteredData = [...this.allParkingSlots];

    // Filter by location
    if (this.filterLocation) {
      const locationLower = this.filterLocation.toLowerCase();
      filteredData = filteredData.filter(slot =>
        slot.location.toLowerCase().includes(locationLower)
      );
    }

    // Filter by status
    if (this.filterStatus) {
      filteredData = filteredData.filter(slot => slot.status === this.filterStatus);
    }

    // Filter by assigned vehicle (match text representation)
    if (this.filterVehicle) {
      const vehicleLower = this.filterVehicle.toLowerCase();
      filteredData = filteredData.filter(slot =>
          slot.assignedVehicleID !== null && this.getCarDetails(slot.assignedVehicleID).toLowerCase().includes(vehicleLower)
      );
    }

    // Sort by location
    filteredData.sort((a, b) => {
        const comparison = a.location.localeCompare(b.location);
        return this.sortLocationAsc ? comparison : -comparison;
    });


    this.filteredParkingSlots = filteredData;
    this.cdr.markForCheck(); // Important for OnPush
  }

  resetFilters(): void {
    this.filterLocation = '';
    this.filterStatus = '';
    this.filterVehicle = '';
    this.sortLocationAsc = true; // Reset sort direction
    this.applyFilters();
  }

   toggleLocationSort(): void {
    this.sortLocationAsc = !this.sortLocationAsc;
    this.applyFilters(); // Re-apply filters to sort
  }

  // --- Clear Filter Methods ---
  clearFilterLocation(): void { this.filterLocation = ''; this.applyFilters(); }
  clearFilterStatus(): void { this.filterStatus = ''; this.applyFilters(); }
  clearFilterVehicle(): void { this.filterVehicle = ''; this.applyFilters(); }


  // --- UI Helpers ---
  getCarDetails(carId: number | null): string {
    if (!carId) return 'N/A';
    const car = this.cars.find(c => c.id === carId);
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'Unknown Car';
  }

   getSlotStatusClass(slot: ExtendedParkingSlot): string {
    if (this.loadingActionSlotId === slot.id) {
        return 'loading-card'; // Style for loading state
    }
    switch (slot.status) {
      case 'Available': return 'available-card';
      case 'Reserved': return 'reserved-card';
      default: return '';
    }
  }

  // Helper for notifications
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'], // Use array for panelClass
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  // --- Calculated Stats Getters ---
  get totalSlotsCount(): number {
    return this.allParkingSlots.length;
  }

  get availableSlotsCount(): number {
    return this.allParkingSlots.filter(slot => slot.status === 'Available').length;
  }

   get reservedSlotsCount(): number {
    return this.allParkingSlots.filter(slot => slot.status === 'Reserved').length;
  }

   get displayedSlotsCount(): number {
       return this.filteredParkingSlots.length;
   }

}