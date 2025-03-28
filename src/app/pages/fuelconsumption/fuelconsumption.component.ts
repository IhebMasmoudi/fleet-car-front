import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core'; // Added OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild
import { CommonModule, DatePipe } from '@angular/common'; // Import CommonModule, DatePipe
import { FormsModule } from '@angular/forms'; // Keep FormsModule for template-driven forms
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // Import Paginator if using
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core'; // Added MatNativeDateModule
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Added MatProgressSpinnerModule
import { MatTooltipModule } from '@angular/material/tooltip'; // Keep MatTooltipModule
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Added MatSnackBarModule
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Import Dialog for potential car details popup

import { Subject } from 'rxjs'; // Import Subject
import { takeUntil, finalize, map } from 'rxjs/operators'; // Import takeUntil, finalize, map

import { IFuelConsumption } from 'src/app/interfaces/IFuelConsumption';
import { ICars } from 'src/app/interfaces/ICars';
import { FuelConsumptionsService } from 'src/app/services/FuelConsumption.Service';
import { CarsService } from 'src/app/services/Cars.service';
// import { CarDetailsDialogComponent } from '../dialogs/car-details-dialog/car-details-dialog.component';


@Component({
  selector: 'app-fuelconsumption',
  standalone: true,
  imports: [
    CommonModule, // Use CommonModule for directives
    FormsModule, // Keep for template-driven form [(ngModel)]
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMenuModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule, // Add Progress Spinner
    MatSnackBarModule, // Add Snackbar
    MatDialogModule, // Add Dialog Module
    MatPaginatorModule, // Add Paginator Module (if using)
    MatOptionModule
  ],
  providers: [DatePipe], // Provide DatePipe if not globally
  templateUrl: './fuelconsumption.component.html',
  styleUrls: ['./fuelconsumption.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Set Change Detection Strategy
})
export class FuelConsumptionComponent implements OnInit, OnDestroy { // Implement OnDestroy

  // --- State Properties ---
  allFuelConsumptions: IFuelConsumption[] = []; // Master list
  cars: ICars[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;         // Loading indicator for data fetching
  loading: boolean = false;           // Loading indicator for actions (add, update, delete)
  showAddForm: boolean = false;
  isEditing: boolean = false;
  filtersExpanded: boolean = false;
  selectedFuelConsumption: IFuelConsumption | null = null;

  // --- Form Fields (template-driven) ---
  fuelDate: Date | null = null;
  fuelTime: string = ''; // Format HH:mm
  fuelAmount: number | null = null; // Use null for better validation checks
  fuelCost: number | null = null;
  fuelMileage: number | null = null;
  fuelVehicleID: number | null = null;

  // --- Filter Properties ---
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  filterMinAmount: number | null = null;
  filterMaxAmount: number | null = null;
  filterMinCost: number | null = null;
  filterMaxCost: number | null = null;
  filterMinMileage: number | null = null;
  filterMaxMileage: number | null = null;
  filterVehicle: string = '';
  sortCostAsc: boolean = true;

  // --- Table Properties ---
  dataSource = new MatTableDataSource<IFuelConsumption>([]);
  displayedColumns: string[] = ['date', 'amount', 'cost', 'mileage', 'vehicle', 'actions'];

  // --- Paginator ---
  // @ViewChild(MatPaginator) paginator!: MatPaginator; // Uncomment if using

  // --- RxJS Subject for Unsubscribing ---
  private destroy$ = new Subject<void>();

  constructor(
    private fuelConsumptionsService: FuelConsumptionsService,
    private carsService: CarsService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private snackBar: MatSnackBar, // Inject MatSnackBar
    private dialog: MatDialog // Inject MatDialog
  ) {}


  ngOnInit(): void {
    this.fetchCars(); // Fetch cars first or concurrently
    this.fetchFuelConsumptions();
  }

  // ngAfterViewInit(): void { // Uncomment if using paginator
  //   this.dataSource.paginator = this.paginator;
  // }

  ngOnDestroy(): void {
    // Complete the subject to unsubscribe
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Fetching ---

  fetchFuelConsumptions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.fuelConsumptionsService.getAllFuelConsumptions()
      .pipe(
        takeUntil(this.destroy$),
        map(records => records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())), // Sort by date descending initially
        finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (records) => {
          this.allFuelConsumptions = records;
          this.applyFilters(); // Apply filters which updates dataSource
          console.log('Fetched fuel consumptions:', records);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching fuel consumptions:', error);
          this.errorMessage = 'Error fetching fuel consumption records.';
          this.allFuelConsumptions = [];
          this.applyFilters(); // Clear table
          this.cdr.markForCheck();
        }
      });
  }

  fetchCars(): void {
    this.carsService.getAllVehicles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cars) => {
          this.cars = cars;
          this.cdr.markForCheck(); // Update view if car list affects template bindings
        },
        error: (error) => {
          console.error('Error fetching cars:', error);
          this.showNotification('Failed to load vehicle list.', 'error'); // Notify user
          this.cdr.markForCheck();
        }
      });
  }

  // --- Form Handling & CRUD ---

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm(); // Clear form when closing
    } else {
        this.isEditing = false; // Ensure not editing when opening fresh
        this.resetForm(); // Clear previous edit state
    }
    this.cdr.markForCheck();
  }

  resetForm(): void {
    // Clear form model properties
    this.fuelDate = null;
    this.fuelTime = '';
    this.fuelAmount = null;
    this.fuelCost = null;
    this.fuelMileage = null;
    this.fuelVehicleID = null;
    // Reset editing state
    this.isEditing = false;
    this.selectedFuelConsumption = null;
    // Don't reset showAddForm here
    this.cdr.markForCheck(); // Update view if needed
  }

  submitFuelForm(): void {
     // Central submit, validation via template #fuelForm.invalid
     // Add specific checks here if template validation isn't enough
     if (!this.fuelDate || !this.fuelTime || this.fuelAmount === null || this.fuelAmount < 0 ||
         this.fuelCost === null || this.fuelCost < 0 || this.fuelMileage === null || this.fuelMileage < 0 ||
         !this.fuelVehicleID) {
         this.showNotification('Please fill all fields correctly (Date, Time, Amount, Cost, Mileage, Vehicle).', 'error');
         // Maybe mark form as touched: fuelForm.form.markAllAsTouched(); ? (Need ViewChild for fuelForm)
         return;
     }

    if (this.isEditing) {
      this.saveEditedFuelConsumption();
    } else {
      this.addFuelConsumption();
    }
  }

  addFuelConsumption(): void {
    // Validation handled by submitFuelForm or template
    this.loading = true;
    this.cdr.markForCheck();

    const combinedDateTime = this.combineDateAndTime(this.fuelDate!, this.fuelTime);
    if (!combinedDateTime) {
        this.showNotification('Invalid date or time provided.', 'error');
        this.loading = false;
        this.cdr.markForCheck();
        return;
    }

    const newRecord: IFuelConsumption = {
      date: combinedDateTime, // Use combined date and time
      amount: this.fuelAmount!,
      cost: this.fuelCost!,
      mileage: this.fuelMileage!,
      vehicleID: this.fuelVehicleID!
    };

    this.fuelConsumptionsService.createFuelConsumption(newRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (record) => {
                this.allFuelConsumptions.unshift(record); // Add to beginning of master list (or push)
                this.applyFilters();          // Update table data
                this.showAddForm = false;     // Close form
                this.resetForm();             // Clear form fields
                this.showNotification('Fuel record added successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error adding fuel consumption:', error);
                this.showNotification('Failed to add fuel record.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

  startEdit(record: IFuelConsumption): void {
    this.selectedFuelConsumption = { ...record };
    this.isEditing = true;

    // Populate form fields
    try {
        this.fuelDate = new Date(record.date); // Convert string/Date to Date object
        this.fuelTime = this.extractTime(record.date); // Extract HH:mm
    } catch (e) {
        console.error("Error parsing date for editing:", e);
        this.showNotification('Could not parse record date.', 'error');
        this.fuelDate = null; // Reset on error
        this.fuelTime = '';
    }
    this.fuelAmount = record.amount;
    this.fuelCost = record.cost;
    this.fuelMileage = record.mileage;
    this.fuelVehicleID = record.vehicleID;

    this.showAddForm = true; // Show the form
    this.cdr.markForCheck();
  }

  saveEditedFuelConsumption(): void {
    // Validation handled by submitFuelForm or template
    if (!this.selectedFuelConsumption || !this.selectedFuelConsumption.id) {
        this.showNotification('Cannot update: Original record ID missing.', 'error');
        return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const combinedDateTime = this.combineDateAndTime(this.fuelDate!, this.fuelTime);
     if (!combinedDateTime) {
        this.showNotification('Invalid date or time provided.', 'error');
        this.loading = false;
        this.cdr.markForCheck();
        return;
    }

    const updatedRecord: IFuelConsumption = {
      ...this.selectedFuelConsumption, // Keep original ID
      date: combinedDateTime,
      amount: this.fuelAmount!,
      cost: this.fuelCost!,
      mileage: this.fuelMileage!,
      vehicleID: this.fuelVehicleID!
    };

    this.fuelConsumptionsService.updateFuelConsumption(this.selectedFuelConsumption.id, updatedRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (updatedFromServer) => { // Assuming backend returns the updated record
                const index = this.allFuelConsumptions.findIndex(f => f.id === this.selectedFuelConsumption?.id);
                if (index !== -1) {
                    this.allFuelConsumptions[index] = updatedFromServer; // Update master list
                }
                this.applyFilters();      // Update table data
                this.showAddForm = false; // Close form
                this.resetForm();         // Clear form fields and editing state
                this.showNotification('Fuel record updated successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error updating fuel consumption:', error);
                this.showNotification('Failed to update fuel record.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

   cancelEdit(): void {
    this.showAddForm = false; // Hide the form
    this.resetForm();       // Clear form fields and editing state
    this.cdr.markForCheck();
  }


  deleteFuelConsumption(id: number | undefined): void {
     if (id === undefined) return;
    if (!confirm('Are you sure you want to delete this fuel consumption record?')) return;

    this.loading = true; // Use general loading flag for button disable
    this.cdr.markForCheck();

    this.fuelConsumptionsService.deleteFuelConsumption(id)
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
          })
       )
      .subscribe({
        next: () => {
          this.allFuelConsumptions = this.allFuelConsumptions.filter(f => f.id !== id); // Remove from master list
          this.applyFilters(); // Update table data
          this.showNotification('Fuel record deleted successfully!', 'success');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error deleting fuel consumption:', error);
          this.showNotification('Failed to delete fuel record.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  // --- Filtering & Sorting ---

  applyFilters(): void {
    let filteredData = [...this.allFuelConsumptions];

    // Filter by date range
    if (this.filterStartDate) {
       const startDate = new Date(this.filterStartDate);
       startDate.setHours(0, 0, 0, 0); // Start of day
      filteredData = filteredData.filter(record => new Date(record.date) >= startDate);
    }
    if (this.filterEndDate) {
       const endDate = new Date(this.filterEndDate);
       endDate.setHours(23, 59, 59, 999); // End of day
      filteredData = filteredData.filter(record => new Date(record.date) <= endDate);
    }

    // Filter by amount range
    if (this.filterMinAmount !== null && this.filterMinAmount !== undefined) {
      filteredData = filteredData.filter(record => record.amount >= this.filterMinAmount!);
    }
    if (this.filterMaxAmount !== null && this.filterMaxAmount !== undefined) {
      filteredData = filteredData.filter(record => record.amount <= this.filterMaxAmount!);
    }

    // Filter by cost range
    if (this.filterMinCost !== null && this.filterMinCost !== undefined) {
      filteredData = filteredData.filter(record => record.cost >= this.filterMinCost!);
    }
    if (this.filterMaxCost !== null && this.filterMaxCost !== undefined) {
      filteredData = filteredData.filter(record => record.cost <= this.filterMaxCost!);
    }

    // Filter by mileage range
    if (this.filterMinMileage !== null && this.filterMinMileage !== undefined) {
      filteredData = filteredData.filter(record => record.mileage >= this.filterMinMileage!);
    }
    if (this.filterMaxMileage !== null && this.filterMaxMileage !== undefined) {
      filteredData = filteredData.filter(record => record.mileage <= this.filterMaxMileage!);
    }

    // Filter by vehicle
    if (this.filterVehicle) {
      const vehicleLower = this.filterVehicle.toLowerCase();
      filteredData = filteredData.filter(record =>
        this.getVehicleModel(record.vehicleID).toLowerCase().includes(vehicleLower)
      );
    }

    // Sort by cost
    filteredData.sort((a, b) =>
      this.sortCostAsc ? (a.cost ?? 0) - (b.cost ?? 0) : (b.cost ?? 0) - (a.cost ?? 0)
    );

    // Update the MatTableDataSource
    this.dataSource.data = filteredData;

    // Reset paginator if using
    // if (this.dataSource.paginator) {
    //   this.dataSource.paginator.firstPage();
    // }

    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterMinAmount = null;
    this.filterMaxAmount = null;
    this.filterMinCost = null;
    this.filterMaxCost = null;
    this.filterMinMileage = null;
    this.filterMaxMileage = null;
    this.filterVehicle = '';
    this.sortCostAsc = true; // Reset sort
    // Re-apply filters with empty values
    this.applyFilters();
  }

  toggleCostSort(): void {
    this.sortCostAsc = !this.sortCostAsc;
    this.applyFilters(); // Re-apply filters to sort
  }

  // --- UI Helpers ---

  // Combines Date and HH:mm string into a formatted string suitable for backend (ISO or specific format)
  private combineDateAndTime(date: Date, time: string): string | null {
    if (!date || !time) return null;
    try {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            throw new Error("Invalid time format");
        }
        const newDate = new Date(date); // Create copy to avoid mutating original date object
        newDate.setHours(hours, minutes, 0, 0); // Set hours, minutes, reset seconds/ms

        // Return ISO string (YYYY-MM-DDTHH:mm:ss.sssZ) or format as needed by backend
        // Using datePipe for flexibility:
        return this.datePipe.transform(newDate, 'yyyy-MM-ddTHH:mm:ss') || newDate.toISOString();
    } catch (error) {
        console.error("Error combining date and time:", error);
        return null;
    }
  }

  // Extracts HH:mm string from a Date object or date string
  private extractTime(dateTime: string | Date): string {
     try {
        const date = new Date(dateTime);
        if (isNaN(date.getTime())) {
             throw new Error("Invalid date provided");
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
     } catch (error) {
         console.error("Error extracting time:", error);
         return ''; // Return empty string on error
     }
  }

  getVehicleModel(vehicleID: number | null): string {
    if (vehicleID === null) return 'N/A';
    const car = this.cars.find(c => c.id === vehicleID);
    // Combine useful info for display and filtering
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'N/A';
  }

  openVehicleDetails(vehicleID: number | null): void {
    if (vehicleID === null) return;
    const car = this.cars.find(c => c.id === vehicleID);
    if (!car) {
        this.showNotification('Vehicle details not found.', 'error');
        return;
    }
    console.log(`Vehicle details requested for vehicle ID: ${vehicleID}`);
    // Replace alert with actual dialog opening if CarDetailsDialogComponent exists and is configured
    alert(`Vehicle: ${car.brand} ${car.model}\nPlate: ${car.licensePlate}\nYear: ${car.year}`);
    // Example using dialog (ensure component is imported and declared/imported)
    // this.dialog.open(CarDetailsDialogComponent, { width: '450px', data: car });
  }

  // Helper for notifications
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  // --- Clear Filter Methods ---
  clearFilterStartDate(): void { this.filterStartDate = null; this.applyFilters(); }
  clearFilterEndDate(): void { this.filterEndDate = null; this.applyFilters(); }
  clearFilterMinAmount(): void { this.filterMinAmount = null; this.applyFilters(); }
  clearFilterMaxAmount(): void { this.filterMaxAmount = null; this.applyFilters(); }
  clearFilterMinCost(): void { this.filterMinCost = null; this.applyFilters(); }
  clearFilterMaxCost(): void { this.filterMaxCost = null; this.applyFilters(); }
  clearFilterMinMileage(): void { this.filterMinMileage = null; this.applyFilters(); }
  clearFilterMaxMileage(): void { this.filterMaxMileage = null; this.applyFilters(); }
  clearFilterVehicle(): void { this.filterVehicle = ''; this.applyFilters(); }

  // --- Calculated Stats Getters ---
  get totalRecordsCount(): number {
    return this.allFuelConsumptions.length;
  }

  get totalFuelAmount(): number {
    return this.allFuelConsumptions.reduce((sum, record) => sum + (record.amount || 0), 0);
  }

  get totalFuelCost(): number {
    return this.allFuelConsumptions.reduce((sum, record) => sum + (record.cost || 0), 0);
  }

  get averageConsumption(): number {
    // Basic calculation: Total Liters / (Total Distance Covered * 100)
    // This requires tracking distance between refills, which isn't directly available here.
    // A simpler (less accurate) metric could be average L per record, or average cost per L.
    // Let's calculate Average Cost per Liter for now.
    const totalAmount = this.totalFuelAmount;
    const totalCost = this.totalFuelCost;
    if (totalAmount === 0) return 0;
     //Average cost per liter:
    return totalCost / totalAmount;
  }

}