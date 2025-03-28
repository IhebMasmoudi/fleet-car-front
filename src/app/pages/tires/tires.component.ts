import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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

import { ITire } from '../../interfaces/ITire';
import { ICars } from '../../interfaces/ICars';
import { TiresService } from '../../services/Tires.Service';
import { CarsService } from '../../services/Cars.service';
// Import CarDetailsDialogComponent if you have one
// import { CarDetailsDialogComponent } from '../dialogs/car-details-dialog/car-details-dialog.component';

@Component({
  selector: 'app-tires',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  templateUrl: './tires.component.html',
  styleUrls: ['./tires.component.scss'], // Point to the SCSS file
  changeDetection: ChangeDetectionStrategy.OnPush // Set Change Detection Strategy
})
export class TiresComponent implements OnInit, OnDestroy {

  // --- State Properties ---
  allTires: ITire[] = []; // Master list
  cars: ICars[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;         // Loading indicator for data fetching
  loading: boolean = false;           // Loading indicator for actions (add, update, delete)
  showAddForm: boolean = false;
  isEditing: boolean = false;
  filtersExpanded: boolean = false;
  selectedTire: ITire | null = null;

  // --- Form Fields (template-driven) ---
  tireBrand: string = '';
  tireModel: string = '';
  tireInstallationDate: Date | null = null;
  tireMileageAtInstallation: number | null = null;
  tireReplacementReason: string = '';
  tireVehicleId: number | null = null;


  // --- Filter Properties ---
  filterBrand: string = '';
  filterModel: string = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  filterMinMileage: number | null = null;
  filterMaxMileage: number | null = null;
  filterVehicle: string = '';
  sortMileageAsc: boolean = true; // Sort by mileage ascending initially

  // --- Table Properties ---
  dataSource = new MatTableDataSource<ITire>([]);
  // Adjusted displayed columns to include 'reason' if desired, or keep as is
  displayedColumns: string[] = ['brand', 'model', 'installationDate', 'mileageAtInstallation', 'vehicle', 'actions'];

  // --- Paginator ---
  // @ViewChild(MatPaginator) paginator!: MatPaginator; // Uncomment if using

  // --- RxJS Subject for Unsubscribing ---
  private destroy$ = new Subject<void>();

  constructor(
    private tiresService: TiresService,
    private carsService: CarsService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private snackBar: MatSnackBar, // Inject MatSnackBar
    private dialog: MatDialog // Inject MatDialog
  ) {}

  // --- Lifecycle Hooks ---

  ngOnInit(): void {
    this.fetchCars(); // Fetch cars first or concurrently
    this.fetchTires();
  }

  // ngAfterViewInit(): void { // Uncomment if using paginator
  //   this.dataSource.paginator = this.paginator;
  // }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Fetching ---

  fetchTires(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.tiresService.getAllTires()
      .pipe(
        takeUntil(this.destroy$),
        map(records => records.sort((a, b) => new Date(b.installationDate).getTime() - new Date(a.installationDate).getTime())), // Sort by date descending initially
        finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (records) => {
          this.allTires = records;
          this.applyFilters(); // Apply filters which updates dataSource
          console.log('Fetched tires:', records);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching tires:', error);
          this.errorMessage = 'Error fetching tire records.';
          this.allTires = [];
          this.applyFilters(); // Clear table
          this.showNotification('Failed to load tire records.', 'error');
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
      this.resetForm(); // Clear form when closing
    } else {
        this.isEditing = false; // Ensure not editing when opening fresh
        this.resetForm(); // Clear previous edit state
    }
    this.cdr.markForCheck();
  }

  resetForm(): void {
    // Clear form model properties
    this.tireBrand = '';
    this.tireModel = '';
    this.tireInstallationDate = null;
    this.tireMileageAtInstallation = null;
    this.tireReplacementReason = '';
    this.tireVehicleId = null;
    // Reset editing state
    this.isEditing = false;
    this.selectedTire = null;
    this.cdr.markForCheck();
  }

  submitTireForm(): void {
    // Central submit, validation via template #tireForm.invalid
    // Add specific checks if template validation isn't enough
    if (!this.tireBrand || !this.tireModel || !this.tireInstallationDate ||
        this.tireMileageAtInstallation === null || this.tireMileageAtInstallation < 0 ||
        !this.tireVehicleId) {
        this.showNotification('Please fill all required fields correctly (Brand, Model, Date, Mileage, Vehicle).', 'error');
        // Consider marking form as touched if needed
        return;
    }

    if (this.isEditing) {
      this.saveEditedTire();
    } else {
      this.addTire();
    }
  }

  addTire(): void {
    // Validation handled by submitTireForm or template
    this.loading = true;
    this.cdr.markForCheck();

    // Format date before sending (adjust format string if backend needs different)
    const formattedDate = this.datePipe.transform(this.tireInstallationDate, 'yyyy-MM-ddTHH:mm:ss') || new Date(this.tireInstallationDate!).toISOString();

    const newRecord: ITire = {
      // id will be assigned by backend
      brand: this.tireBrand,
      model: this.tireModel,
      installationDate: formattedDate,
      mileageAtInstallation: this.tireMileageAtInstallation!,
      replacementReason: this.tireReplacementReason, // Optional field
      vehicleId: this.tireVehicleId!
    };

    this.tiresService.createTire(newRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (record) => {
                this.allTires.unshift(record); // Add to beginning of master list
                this.applyFilters();          // Update table data
                this.showAddForm = false;     // Close form
                this.resetForm();             // Clear form fields
                this.showNotification('Tire record added successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error adding tire:', error);
                this.showNotification('Failed to add tire record.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

  startEdit(record: ITire): void {
    this.selectedTire = { ...record };
    this.isEditing = true;

    // Populate form fields
    this.tireBrand = record.brand;
    this.tireModel = record.model;
    try {
        this.tireInstallationDate = new Date(record.installationDate); // Convert string/Date to Date object
    } catch (e) {
        console.error("Error parsing installation date for editing:", e);
        this.showNotification('Could not parse record date.', 'error');
        this.tireInstallationDate = null; // Reset on error
    }
    this.tireMileageAtInstallation = record.mileageAtInstallation;
    this.tireReplacementReason = record.replacementReason || ''; // Handle potentially null/undefined reason
    this.tireVehicleId = record.vehicleId;

    this.showAddForm = true; // Show the form
    this.cdr.markForCheck();
  }

  saveEditedTire(): void {
    // Validation handled by submitTireForm or template
    if (!this.selectedTire || !this.selectedTire.id) {
        this.showNotification('Cannot update: Original record ID missing.', 'error');
        return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    // Format date before sending
    const formattedDate = this.datePipe.transform(this.tireInstallationDate, 'yyyy-MM-ddTHH:mm:ss') || new Date(this.tireInstallationDate!).toISOString();

    const updatedRecord: ITire = {
      ...this.selectedTire, // Keep original ID
      brand: this.tireBrand,
      model: this.tireModel,
      installationDate: formattedDate,
      mileageAtInstallation: this.tireMileageAtInstallation!,
      replacementReason: this.tireReplacementReason,
      vehicleId: this.tireVehicleId!
    };

    this.tiresService.updateTire(this.selectedTire.id, updatedRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (updatedFromServer) => { // Assuming backend returns the updated record
                const index = this.allTires.findIndex(t => t.id === this.selectedTire?.id);
                if (index !== -1) {
                    this.allTires[index] = updatedFromServer; // Update master list
                } else {
                    // Fallback if index not found (less likely with OnPush but good practice)
                    this.allTires = this.allTires.map(t => t.id === this.selectedTire?.id ? updatedFromServer : t);
                }
                this.applyFilters();      // Update table data
                this.showAddForm = false; // Close form
                this.resetForm();         // Clear form fields and editing state
                this.showNotification('Tire record updated successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error updating tire:', error);
                this.showNotification('Failed to update tire record.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

   cancelEdit(): void {
    this.showAddForm = false; // Hide the form
    this.resetForm();       // Clear form fields and editing state
    this.cdr.markForCheck();
  }


  deleteTire(id: number | undefined): void {
     if (id === undefined) {
         this.showNotification('Cannot delete: Tire ID is missing.', 'error');
         return;
     };
    // Use a Material Dialog for confirmation later if desired
    if (!confirm('Are you sure you want to delete this tire record?')) return;

    this.loading = true; // Use general loading flag for button disable
    this.cdr.markForCheck();

    this.tiresService.deleteTire(id)
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
          })
       )
      .subscribe({
        next: () => {
          this.allTires = this.allTires.filter(t => t.id !== id); // Remove from master list
          this.applyFilters(); // Update table data
          this.showNotification('Tire record deleted successfully!', 'success');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error deleting tire:', error);
          this.showNotification('Failed to delete tire record.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  // --- Filtering & Sorting ---

  applyFilters(): void {
    let filteredData = [...this.allTires];

    // Filter by brand
    if (this.filterBrand) {
      filteredData = filteredData.filter(record =>
        record.brand.toLowerCase().includes(this.filterBrand.toLowerCase())
      );
    }

    // Filter by model
    if (this.filterModel) {
      filteredData = filteredData.filter(record =>
        record.model.toLowerCase().includes(this.filterModel.toLowerCase())
      );
    }

    // Filter by date range
    if (this.filterStartDate) {
       const startDate = new Date(this.filterStartDate);
       startDate.setHours(0, 0, 0, 0); // Start of day
      filteredData = filteredData.filter(record => new Date(record.installationDate) >= startDate);
    }
    if (this.filterEndDate) {
       const endDate = new Date(this.filterEndDate);
       endDate.setHours(23, 59, 59, 999); // End of day
      filteredData = filteredData.filter(record => new Date(record.installationDate) <= endDate);
    }

    // Filter by mileage range
    if (this.filterMinMileage !== null && this.filterMinMileage !== undefined) {
      filteredData = filteredData.filter(record => record.mileageAtInstallation >= this.filterMinMileage!);
    }
    if (this.filterMaxMileage !== null && this.filterMaxMileage !== undefined) {
      filteredData = filteredData.filter(record => record.mileageAtInstallation <= this.filterMaxMileage!);
    }

    // Filter by vehicle
    if (this.filterVehicle) {
      const vehicleLower = this.filterVehicle.toLowerCase();
      filteredData = filteredData.filter(record =>
        this.getVehicleModel(record.vehicleId).toLowerCase().includes(vehicleLower)
      );
    }

    // Sort by mileage
    filteredData.sort((a, b) =>
      this.sortMileageAsc ? a.mileageAtInstallation - b.mileageAtInstallation : b.mileageAtInstallation - a.mileageAtInstallation
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
    this.filterBrand = '';
    this.filterModel = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterMinMileage = null;
    this.filterMaxMileage = null;
    this.filterVehicle = '';
    this.sortMileageAsc = true; // Reset sort
    // Re-apply filters with empty values
    this.applyFilters();
  }

  toggleMileageSort(): void {
    this.sortMileageAsc = !this.sortMileageAsc;
    this.applyFilters(); // Re-apply filters to sort
  }

  // --- UI Helpers ---

  getVehicleModel(vehicleId: number | null): string {
    if (vehicleId === null) return 'N/A';
    const car = this.cars.find(c => c.id === vehicleId);
    // Combine useful info for display and filtering
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'N/A';
  }

  openVehicleDetails(vehicleId: number | null): void {
    if (vehicleId === null) return;
    const car = this.cars.find(c => c.id === vehicleId);
    if (!car) {
        this.showNotification('Vehicle details not found.', 'error');
        return;
    }
    console.log(`Vehicle details requested for vehicle ID: ${vehicleId}`);
    // Replace alert with actual dialog opening if CarDetailsDialogComponent exists
    alert(`Vehicle: ${car.brand} ${car.model}\nPlate: ${car.licensePlate}\nYear: ${car.year}`);
    // Example using dialog:
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
  clearFilterBrand(): void { this.filterBrand = ''; this.applyFilters(); }
  clearFilterModel(): void { this.filterModel = ''; this.applyFilters(); }
  clearFilterStartDate(): void { this.filterStartDate = null; this.applyFilters(); }
  clearFilterEndDate(): void { this.filterEndDate = null; this.applyFilters(); }
  clearFilterMinMileage(): void { this.filterMinMileage = null; this.applyFilters(); }
  clearFilterMaxMileage(): void { this.filterMaxMileage = null; this.applyFilters(); }
  clearFilterVehicle(): void { this.filterVehicle = ''; this.applyFilters(); }

  // --- Calculated Stats Getters ---
  get totalRecordsCount(): number {
    // Use dataSource.data if you only want to count filtered items,
    // or allTires for total overall items. Let's use filtered count for display.
    return this.dataSource.data.length;
    // return this.allTires.length; // Alternative: total overall records
  }

  // Add other relevant stats if needed, e.g., average mileage (might be tricky)
   get averageMileageAtInstallation(): number {
     if (this.dataSource.data.length === 0) return 0;
     const totalMileage = this.dataSource.data.reduce((sum, tire) => sum + (tire.mileageAtInstallation || 0), 0);
     return totalMileage / this.dataSource.data.length;
   }

}