import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms'; // Import NgForm
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip'; // Import MatTooltipModule
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Import MatProgressSpinnerModule

import { IMaintenance } from '../../interfaces/IMaintenance';
import { MaintenancesService } from '../../services/Maintenance.Service';
import { CarsService } from '../../services/Cars.service';
import { ICars } from '../../interfaces/ICars';
import { AuthService } from 'src/app/services/AuthService.Service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'], // Ensure this points to the correct SCSS file
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // Add ReactiveFormsModule if using reactive forms features later
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTooltipModule, // Add MatTooltipModule
    MatProgressSpinnerModule // Add MatProgressSpinnerModule
  ],
  providers: [DatePipe], // Add DatePipe provider if not globally provided
  changeDetection: ChangeDetectionStrategy.OnPush // Set Change Detection Strategy
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  maintenances: IMaintenance[] = [];
  allMaintenances: IMaintenance[] = []; // Store all fetched records before filtering
  cars: ICars[] = [];
  errorMessage: string = '';
  isLoading: boolean = false; // Loading indicator
  userRole: string | null = null;
  userId: number | null = null;

  showAddForm: boolean = false;
  isEditing: boolean = false;
  isRequestingMaintenance: boolean = false;
  filtersExpanded: boolean = false; // Control filter visibility
  isShowingOnlyPending: boolean = false; // Track if only pending are shown

  // Form fields
  maintenanceType: string = '';
  maintenanceCost: number = 0;
  maintenanceDate: Date | null = null;
  maintenanceNotes: string = '';
  maintenanceVehicleID: number | null = null;

  selectedMaintenance: IMaintenance | null = null;

  // Filter properties
  filterType: string = '';
  filterMinCost: number | null = null;
  filterMaxCost: number | null = null;
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  filterVehicle: string = '';
  // filterNotes: string = ''; // Filter by notes can be less performant/useful, removed for now
  sortCostAsc: boolean = true;
  filterStatus: string = ''; // Filter by Status

  // Table
  displayedColumns: string[] = ['type', 'cost', 'maintenanceDate', 'notes', 'vehicle', 'status', 'actions'];
  dataSource = new MatTableDataSource<IMaintenance>([]); // Initialize empty

  private destroy$ = new Subject<void>(); // For unsubscribing

  constructor(
    private maintenancesService: MaintenancesService,
    private carsService: CarsService,
    private authService: AuthService,
    private datePipe: DatePipe, // Inject DatePipe
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoleAndFetchData();
    this.fetchCars();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoleAndFetchData(): void {
    this.isLoading = true; // Start loading before fetching role
    this.cdr.markForCheck();

    this.authService.loadUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: role => {
          this.userRole = role;
          const userIdString = this.authService.getUserId();
          this.userId = userIdString ? parseInt(userIdString, 10) : null;
          this.fetchMaintenancesBasedOnRole(); // Fetch data after role is known
        },
        error: error => {
          console.error('Error loading user profile:', error);
          this.errorMessage = 'Error loading user profile. Cannot determine data access.';
          this.isLoading = false;
          this.cdr.markForCheck();
          // Maybe fetch all as a fallback, or show error clearly
          // this.fetchMaintenances();
        }
      });
  }

  fetchMaintenancesBasedOnRole(): void {
    this.isLoading = true;
    this.errorMessage = ''; // Clear previous errors
    this.cdr.markForCheck();

    let maintenanceObservable;

    if (this.userRole === 'ADMIN' || this.userRole === 'MANAGER') {
      maintenanceObservable = this.maintenancesService.getAllMaintenances();
    } else if (this.userRole === 'DRIVER' && this.userId !== null) {
      maintenanceObservable = this.maintenancesService.getMaintenancesByDriverId(this.userId);
    } else {
      // Handle cases where role is unknown or driver ID is missing
      console.error('Cannot fetch maintenances: Role unknown or Driver ID missing.');
      this.errorMessage = 'Could not determine appropriate maintenance records to load.';
      this.isLoading = false;
      this.cdr.markForCheck();
      return; // Exit if no valid observable
    }

    maintenanceObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (records) => {
          this.allMaintenances = records; // Store the full list
          this.maintenances = [...this.allMaintenances]; // Initialize filtered list
          this.applyFilters(); // Apply filters immediately
          this.isLoading = false;
          this.cdr.markForCheck(); // Trigger change detection
        },
        error: (error) => {
          console.error('Error fetching maintenances:', error);
          this.errorMessage = 'Error fetching maintenance records.';
          this.isLoading = false;
          this.allMaintenances = [];
          this.maintenances = [];
          this.dataSource.data = [];
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
          // Optionally show an error message or handle
          this.cdr.markForCheck();
        }
      });
  }

  resetForm(): void {
    this.isEditing = false;
    this.isRequestingMaintenance = false;
    this.selectedMaintenance = null;
    this.maintenanceType = '';
    this.maintenanceCost = 0;
    this.maintenanceDate = null;
    this.maintenanceNotes = '';
    this.maintenanceVehicleID = null;
    this.showAddForm = false;
    this.cdr.markForCheck(); // Ensure UI updates
  }

  // Combined Add/Request logic triggered by form toggle
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
        this.isEditing = false; // Ensure not in edit mode when opening fresh
        // Set if it's a request based on role when opening the form
        this.isRequestingMaintenance = this.userRole === 'DRIVER';
    } else {
        this.resetForm(); // Clear form when closing
    }
    this.cdr.markForCheck();
  }


  addMaintenance(): void { // ADMIN/MANAGER Adds directly (status usually 'Accepted')
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID) {
      this.errorMessage = 'Please fill in Type, Date, and Vehicle.';
      this.cdr.markForCheck();
      return;
    }

    const newRecord: IMaintenance = {
      type: this.maintenanceType,
      cost: this.maintenanceCost,
      maintenanceDate: this.formatDateForAPI(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID,
      // Admin/Manager might add completed or scheduled/accepted records directly
      status: this.determineInitialStatus() // Example: Default to 'Accepted' or let them choose?
    };

    this.isLoading = true; // Show loading indicator
    this.cdr.markForCheck();

    // Use driverId 0 or null if the backend expects it for non-driver-initiated requests
    const initiatorId = 0; // Or adapt based on backend requirements

    this.maintenancesService.createMaintenanceRequest(newRecord, initiatorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
          next: (record) => {
              this.allMaintenances.push(record); // Add to the master list
              this.resetForm();
              this.applyFilters(); // Refresh displayed data
              this.isLoading = false;
              alert('Maintenance record added successfully!');
              this.cdr.markForCheck();
          },
          error: (error) => {
              console.error('Error adding maintenance:', error);
              this.errorMessage = 'Failed to add maintenance record.';
              this.isLoading = false;
              this.cdr.markForCheck();
          }
      });
  }

  requestMaintenance(): void { // DRIVER Requests (status 'Pending')
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID || !this.userId) {
      this.errorMessage = 'Please fill in Type, Date, and Vehicle. Ensure you are logged in.';
      this.cdr.markForCheck();
      return;
    }

    const newRequest: IMaintenance = {
      type: this.maintenanceType,
      maintenanceDate: this.formatDateForAPI(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID,
      cost: 0, // Driver requests usually start with 0 cost
      status: 'Pending' // Driver requests are always 'Pending' initially
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.maintenancesService.createMaintenanceRequest(newRequest, this.userId)
     .pipe(takeUntil(this.destroy$))
     .subscribe({
        next: (record) => {
            this.allMaintenances.push(record); // Add to master list
            this.resetForm();
            this.applyFilters(); // Refresh display
            this.isLoading = false;
            alert('Maintenance request submitted successfully!');
            this.cdr.markForCheck();
        },
        error: (error) => {
            console.error('Error requesting maintenance:', error);
            this.errorMessage = 'Failed to submit maintenance request.';
            this.isLoading = false;
            this.cdr.markForCheck();
        }
      });
  }

  // Helper to determine initial status when Admin/Manager adds
  determineInitialStatus(): string {
      // Could be based on date (past = completed, future = accepted?)
      // Or always default to 'Accepted'
      return 'Accepted';
  }

  startEdit(record: IMaintenance): void {
    this.selectedMaintenance = { ...record };
    this.isEditing = true;
    this.showAddForm = true;
    this.isRequestingMaintenance = false; // Edit mode is never a "request" form

    this.maintenanceType = record.type;
    // Cost might only be editable by Admin/Manager, or if status allows
    this.maintenanceCost = record.cost;
    this.maintenanceDate = new Date(record.maintenanceDate); // Ensure it's a Date object
    this.maintenanceNotes = record.notes || ''; // Handle null notes
    this.maintenanceVehicleID = record.vehicleID;

    this.cdr.markForCheck();
  }

  // Removed startRequestMaintenance - integrated into toggleAddForm

  saveEditedMaintenance(): void {
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID || !this.selectedMaintenance || !this.selectedMaintenance.id) {
      this.errorMessage = 'Required fields missing or record ID not found.';
      this.cdr.markForCheck();
      return;
    }

    // Create the updated object - include status if it's editable in your workflow
    const updatedRecord: IMaintenance = {
      ...this.selectedMaintenance,
      type: this.maintenanceType,
      cost: this.maintenanceCost, // Update cost
      maintenanceDate: this.formatDateForAPI(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID
      // status: this.selectedMaintenance.status // Keep original status unless changed
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.maintenancesService.updateMaintenance(this.selectedMaintenance.id, updatedRecord)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => { // Assuming the backend returns the updated record
          const index = this.allMaintenances.findIndex(m => m.id === this.selectedMaintenance?.id);
          if (index !== -1) {
            this.allMaintenances[index] = updated; // Update master list
          }
          this.resetForm();
          this.applyFilters(); // Refresh display
          this.isLoading = false;
          alert('Maintenance record updated successfully!');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error updating maintenance:', error);
          this.errorMessage = 'Failed to update maintenance record.';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
    });
  }

  deleteMaintenance(id: number): void {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.maintenancesService.deleteMaintenance(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.allMaintenances = this.allMaintenances.filter(m => m.id !== id); // Remove from master
          this.applyFilters(); // Refresh display
          this.isLoading = false;
          alert('Maintenance record deleted successfully!');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error deleting maintenance:', error);
          this.errorMessage = 'Failed to delete maintenance record.';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  acceptMaintenanceRequest(maintenanceId: number): void {
    if (!confirm('Are you sure you want to accept this maintenance request?')) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.maintenancesService.acceptMaintenance(maintenanceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRecord) => { // Assume backend returns the updated record
            const index = this.allMaintenances.findIndex(m => m.id === maintenanceId);
            if (index !== -1) {
                this.allMaintenances[index] = updatedRecord; // Update master list
            }
            this.applyFilters(); // Refresh display
            this.isLoading = false;
            alert('Maintenance request accepted successfully!');
            this.cdr.markForCheck();
        },
        error: (error) => {
            console.error('Error accepting maintenance request:', error);
            this.errorMessage = 'Failed to accept maintenance request.';
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    });
  }

  rejectMaintenanceRequest(maintenanceId: number): void {
    if (!confirm('Are you sure you want to reject this maintenance request?')) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.maintenancesService.rejectMaintenance(maintenanceId)
       .pipe(takeUntil(this.destroy$))
       .subscribe({
        next: (updatedRecord) => { // Assume backend returns the updated record
            const index = this.allMaintenances.findIndex(m => m.id === maintenanceId);
            if (index !== -1) {
                this.allMaintenances[index] = updatedRecord; // Update master list
            }
            this.applyFilters(); // Refresh display
            this.isLoading = false;
            alert('Maintenance request rejected successfully!');
            this.cdr.markForCheck();
        },
        error: (error) => {
            console.error('Error rejecting maintenance request:', error);
            this.errorMessage = 'Failed to reject maintenance request.';
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    });
  }

  // Use DatePipe for formatting display dates if needed, but API needs yyyy-MM-dd
  formatDateForAPI(date: Date | null): string {
      if (!date) return '';
      // Use datePipe or manual formatting
      return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  getVehicleModel(vehicleID: number | null): string {
    if (vehicleID === null) return 'N/A';
    const car = this.cars.find(c => c.id === vehicleID);
    // Return a shorter version for the chip if needed
    return car ? `${car.model} (${car.licensePlate})` : 'N/A';
  }

  // Removed getDriverName - Not displayed in the main table anymore

  applyFilters(): void {
    // Start with the full dataset for the current user
    let filteredData = [...this.allMaintenances];

    // Apply text filters (case-insensitive)
    if (this.filterType) {
      filteredData = filteredData.filter(record =>
        record.type.toLowerCase().includes(this.filterType.toLowerCase())
      );
    }
    if (this.filterVehicle) {
      // Filter based on the string generated by getVehicleModel
      filteredData = filteredData.filter(record =>
        this.getVehicleModel(record.vehicleID).toLowerCase().includes(this.filterVehicle.toLowerCase())
      );
    }

    // Apply cost filters
    if (this.filterMinCost !== null && this.filterMinCost !== undefined) {
      filteredData = filteredData.filter(record => record.cost >= this.filterMinCost!);
    }
    if (this.filterMaxCost !== null && this.filterMaxCost !== undefined) {
      filteredData = filteredData.filter(record => record.cost <= this.filterMaxCost!);
    }

    // Apply date filters (handle timezones carefully if necessary)
     if (this.filterStartDate) {
       const startDate = new Date(this.filterStartDate);
       startDate.setHours(0, 0, 0, 0); // Normalize to start of day
      filteredData = filteredData.filter(record =>
        new Date(record.maintenanceDate) >= startDate
      );
    }
    if (this.filterEndDate) {
       const endDate = new Date(this.filterEndDate);
       endDate.setHours(23, 59, 59, 999); // Normalize to end of day
      filteredData = filteredData.filter(record =>
        new Date(record.maintenanceDate) <= endDate
      );
    }

    // Apply status filter
    if (this.filterStatus) {
      filteredData = filteredData.filter(record =>
        record.status?.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }

    // Apply sorting
    filteredData.sort((a, b) =>
      this.sortCostAsc ? (a.cost ?? 0) - (b.cost ?? 0) : (b.cost ?? 0) - (a.cost ?? 0)
    );

    // Update the MatTableDataSource
    this.maintenances = filteredData; // Update the array bound to stats/counts
    this.dataSource.data = this.maintenances;
    this.cdr.markForCheck(); // Notify Angular of changes
  }

  resetFilters(): void {
    this.filterType = '';
    this.filterMinCost = null;
    this.filterMaxCost = null;
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterVehicle = '';
    this.filterStatus = ''; // Reset status filter
    this.isShowingOnlyPending = false; // Ensure pending filter toggle is reset
    // Re-apply filters which will now use the empty values, showing all data
    this.applyFilters();
  }

  toggleCostSort(): void {
    this.sortCostAsc = !this.sortCostAsc;
    this.applyFilters(); // Re-apply filters to sort
  }

  // Renamed from togglePendingRequestsTable
  togglePendingFilter(): void {
    this.isShowingOnlyPending = !this.isShowingOnlyPending;
    if (this.isShowingOnlyPending) {
        this.filterStatus = 'Pending'; // Set filter
    } else {
        this.filterStatus = ''; // Clear filter
    }
    this.applyFilters(); // Apply the change
     this.filtersExpanded = true; // Optionally expand filters when toggling pending
     this.cdr.markForCheck();
  }

  // --- Clear Filter Methods ---
  clearFilterType(): void { this.filterType = ''; this.applyFilters(); }
  clearFilterMinCost(): void { this.filterMinCost = null; this.applyFilters(); }
  clearFilterMaxCost(): void { this.filterMaxCost = null; this.applyFilters(); }
  clearFilterStartDate(): void { this.filterStartDate = null; this.applyFilters(); }
  clearFilterEndDate(): void { this.filterEndDate = null; this.applyFilters(); }
  clearFilterVehicle(): void { this.filterVehicle = ''; this.applyFilters(); }
  // No clear for status select, just select 'All'

  // --- Table Row Styling ---
  getRowClass(record: IMaintenance): string {
    // Example: Highlight pending rows, could customize further
    if (record.status === 'Pending' || record.status === 'In Progress') {
      return 'warning-row'; // Matches insurance component's warning row style
    }
    if (record.status === 'Rejected' || record.status === 'Cancelled') {
        return 'expired-row'; // Use the 'expired' style for negative outcomes
    }
    return ''; // Default
  }

  // --- Calculated Stats ---
  get totalRecordsCount(): number {
    // Use the filtered data count if filters are applied, or allMaintenances if showing all
    // For simplicity, let's count the currently displayed data length
    return this.dataSource.data.length;
    // Or return this.allMaintenances.length; // If you want total overall regardless of filters
  }

  get pendingCount(): number {
    // Count from the full dataset based on role access
    return this.allMaintenances.filter(m => m.status === 'Pending').length;
  }

  get AcceptedCount(): number {
    return this.allMaintenances.filter(m => m.status === 'Accepted').length;
  }

   get RejectedCount(): number {
    return this.allMaintenances.filter(m => m.status === 'Rejected').length;
  }


   // Placeholder for potential navigation/dialog
  openCarDetails(vehicleID: number | null): void {
    if(vehicleID === null) return;
    console.log(`Car details requested for vehicle ID: ${vehicleID}`);
    // Implement actual navigation or dialog opening here
    alert(`Navigate to details for vehicle ID: ${vehicleID}`);
  }

  cancelEdit(): void { // Used by the form's cancel button
    this.resetForm();
  }
}