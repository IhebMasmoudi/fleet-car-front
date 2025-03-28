// Core Angular imports
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
// Router imports
import { ActivatedRoute, Router } from '@angular/router'; // Router might be useful later
// Common module for directives (*ngIf, *ngFor, etc.)
import { CommonModule, DatePipe } from '@angular/common'; // Added DatePipe
// Forms module for template-driven forms [(ngModel)]
import { FormsModule } from '@angular/forms';
// Angular Material module imports
import { MatTableDataSource, MatTableModule } from '@angular/material/table'; // For the data table
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // For table pagination
import { MatCardModule } from '@angular/material/card'; // For card layout
import { MatButtonModule } from '@angular/material/button'; // For buttons
import { MatIconModule } from '@angular/material/icon'; // For icons
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core'; // For select options and date picker native support
import { MatSelectModule } from '@angular/material/select'; // For dropdowns
import { MatFormFieldModule } from '@angular/material/form-field'; // For form field styling
import { MatInputModule } from '@angular/material/input'; // For text inputs
import { MatDatepickerModule } from '@angular/material/datepicker'; // For date pickers
import { MatMenuModule } from '@angular/material/menu'; // For action menus (if needed)
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For loading indicators
import { MatTooltipModule } from '@angular/material/tooltip'; // For tooltips
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // For notifications
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // For dialogs (Driver/Car details)

// RxJS imports
import { Subject } from 'rxjs'; // For unsubscribing from observables
import { takeUntil, finalize, map, switchMap, catchError, tap, filter } from 'rxjs/operators'; // Observable operators

// Application-specific interfaces
import { IMission } from 'src/app/interfaces/IMission';
import { ICars } from 'src/app/interfaces/ICars';
import { IDriver } from 'src/app/interfaces/IDriver';
import { IUser } from 'src/app/interfaces/IUser'; // Assuming IUser is needed for driver name

// Application-specific services
import { MissionsService } from 'src/app/services/Mission.Service';
import { CarsService } from 'src/app/services/Cars.service';
import { DriverService } from 'src/app/services/Driver.service';
import { UserService } from 'src/app/services/UserService.service'; // For fetching usernames

// Dialog components (if they exist in separate files)
import { DriverDetailsDialogComponent } from './driver-details-dialog.component';
import { CarDetailsDialogComponent } from './car-details-dialog.component';


@Component({
  selector: 'app-missions',
  standalone: true, // Mark as standalone
  imports: [
    // Angular Modules
    CommonModule,
    FormsModule,
    // Material Modules
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
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatOptionModule
    // Dialog components are typically not listed in 'imports' unless they are also standalone
  ],
  providers: [DatePipe], // Provide DatePipe for formatting dates
  templateUrl: './missions.component.html',
  styleUrls: ['./missions.component.scss'], // Use the modern SCSS
  changeDetection: ChangeDetectionStrategy.OnPush // Set Change Detection Strategy
})
export class MissionsComponent implements OnInit, OnDestroy, AfterViewInit {

  // --- State Properties ---
  allMissions: IMission[] = []; // Master list of all missions
  vehicles: ICars[] = []; // List of all vehicles
  drivers: IDriver[] = []; // List of all drivers
  errorMessage: string = ''; // Holds error messages for display
  isLoading: boolean = false; // Loading indicator for initial data fetch
  loading: boolean = false; // Loading indicator for CRUD actions (add, update, delete)
  showAddForm: boolean = false; // Controls visibility of the add/edit form
  isEditing: boolean = false; // Flag to indicate if the form is in edit mode
  filtersExpanded: boolean = false; // Flag to control filter section visibility
  selectedMission: IMission | null = null; // Holds the mission being edited

  // --- Form Fields (template-driven) ---
  missionDestination: string = '';
  missionStartDate: Date | null = null;
  missionEndDate: Date | null = null;
  missionDistance: number | null = null;
  missionStatus: string = ''; // Consider using specific types like 'pending' | 'in-progress' etc.
  missionVehicleID: number | null = null;
  missionDriverID: number | null = null;

  // --- Filter Properties ---
  filterDestination: string = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  filterStatus: string = ''; // Empty string means 'All'
  filterVehicle: string = ''; // Filter by text representation of vehicle
  filterUsername: string = ''; // Filter by driver's username
  sortDistanceAsc: boolean = true; // Sort direction for distance

  // --- Table Properties ---
  dataSource = new MatTableDataSource<IMission>([]); // DataSource for the Material table
  // Available statuses for filtering/selection
  availableStatuses: string[] = ['All', 'pending', 'in-progress', 'Completed', 'Cancelled'];
  displayedColumns: string[] = ['destination', 'startDate', 'endDate', 'distance', 'status', 'vehicle', 'driver', 'actions'];

  // --- Lookups ---
  vehicleModels: { [key: number]: string } = {}; // Cache for vehicle display names
  driverUsernames: { [key: number]: string } = {}; // Cache for driver usernames

  // --- Paginator ---
  @ViewChild(MatPaginator) paginator!: MatPaginator; // Reference to the paginator component

  // --- RxJS Subject for Unsubscribing ---
  private destroy$ = new Subject<void>(); // Subject to signal component destruction

  constructor(
    private missionsService: MissionsService, // Service for mission data
    private carsService: CarsService, // Service for vehicle data
    private driverService: DriverService, // Service for driver data
    private userService: UserService, // Service for user data (driver names)
    public dialog: MatDialog, // Service for opening Material dialogs
    private cdr: ChangeDetectorRef, // Service to manually trigger change detection
    private snackBar: MatSnackBar, // Service to show snackbar notifications
    private datePipe: DatePipe // Service to format dates
  ) {}

  // --- Lifecycle Hooks ---

  ngOnInit(): void {
    // Fetch initial data when component loads
    this.fetchLookups(); // Fetch vehicles and drivers first
    this.fetchMissions();
  }

  ngAfterViewInit(): void {
    // Set the paginator for the table after the view is initialized
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    // Signal completion and cleanup subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Fetching ---

  fetchMissions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck(); // Notify Angular to check for changes

    this.missionsService.getAllMissions()
      .pipe(
        takeUntil(this.destroy$), // Automatically unsubscribe when component is destroyed
        map(missions => missions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())), // Sort by start date descending initially
        finalize(() => { // Execute when the observable completes or errors
          this.isLoading = false;
          this.cdr.markForCheck(); // Ensure loading state change is detected
        })
      )
      .subscribe({
        next: (missions) => {
          this.allMissions = missions;
          this.applyFilters(); // Apply filters which updates dataSource
          console.log('Fetched missions:', missions);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching missions:', error);
          this.errorMessage = 'Error fetching mission records.';
          this.allMissions = [];
          this.applyFilters(); // Clear table
          this.showNotification('Failed to load mission records.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  fetchLookups(): void {
     // Fetch vehicles and drivers concurrently (can be separated if needed)
     this.fetchVehicles();
     this.fetchDrivers();
  }

  fetchVehicles(): void {
    this.carsService.getAllVehicles()
     .pipe(takeUntil(this.destroy$))
     .subscribe({
        next: vehicles => {
            this.vehicles = vehicles;
            // Populate cache for vehicle display names
            this.vehicleModels = vehicles.reduce((acc, vehicle) => {
                if (vehicle.id !== undefined) {
                    acc[vehicle.id] = `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
                }
                return acc;
            }, {} as { [key: number]: string });
            this.cdr.markForCheck(); // Update view if lookups affect template
        },
        error: error => {
            console.error('Error fetching vehicles:', error);
            this.showNotification('Failed to load vehicle list.', 'error');
        }
     });
  }

  fetchDrivers(): void {
    this.driverService.getAllDrivers()
      .pipe(
        takeUntil(this.destroy$),
        // Use switchMap to fetch user details for each driver sequentially or concurrently
        // This example fetches all drivers first, then potentially fetches users as needed
        tap(drivers => { // Use tap to process drivers without altering the stream for applyFilters if needed
             this.drivers = drivers;
        })
      )
      .subscribe({
        next: () => {
           this.applyFilters(); // Re-apply filters if driver names affect filtering/display immediately
           this.cdr.markForCheck();
        },
        error: error => {
           console.error('Error fetching drivers:', error);
           this.showNotification('Failed to load driver list.', 'error');
        }
      });
  }

  // Fetch username for a specific driver and cache it
  fetchDriverUsername(driverId: number, userId: number): void {
      if (this.driverUsernames[driverId]) return; // Already fetched or fetching

      // Indicate loading state for this specific driver name if needed
      this.driverUsernames[driverId] = 'Loading...';
      this.cdr.markForCheck();

      this.userService.getUserById(userId)
         .pipe(
             takeUntil(this.destroy$),
             catchError(error => {
                 console.error(`Error fetching username for userId ${userId}:`, error);
                 this.driverUsernames[driverId] = 'Unknown User';
                 this.cdr.markForCheck();
                 return []; // Return empty observable on error
             })
         )
         .subscribe(user => {
             this.driverUsernames[driverId] = user ? user.username : 'Unknown User';
             this.cdr.markForCheck(); // Update the view with the fetched name
         });
  }

  // Get cached or fetch driver username
  getDriverUsername(driverId: number | null): string {
    if (driverId === null || driverId === undefined) return 'N/A';

    // Check cache first
    if (this.driverUsernames[driverId] && this.driverUsernames[driverId] !== 'Loading...') {
        return this.driverUsernames[driverId];
    }

    // Find driver to get userId
    const driver = this.drivers.find(d => d.id === driverId);
    if (driver && driver.userId) {
        // If not in cache and not loading, initiate fetch
        if (!this.driverUsernames[driverId]) {
            this.fetchDriverUsername(driverId, driver.userId);
        }
        // Return current state (might be 'Loading...')
        return this.driverUsernames[driverId] || 'Loading...';
    }

    return 'Unknown Driver'; // Driver or userId not found
  }

  // Get cached vehicle model name
  getVehicleModel(vehicleID: number | null): string {
    if (vehicleID === null || vehicleID === undefined) return 'N/A';
    return this.vehicleModels[vehicleID] || 'Unknown Vehicle';
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
    this.missionDestination = '';
    this.missionStartDate = null;
    this.missionEndDate = null;
    this.missionDistance = null;
    this.missionStatus = ''; // Reset to default/empty
    this.missionVehicleID = null;
    this.missionDriverID = null;
    // Reset editing state
    this.isEditing = false;
    this.selectedMission = null;
    // Don't reset showAddForm here
    this.cdr.markForCheck();
  }

  submitMissionForm(): void {
    // Basic validation (can be enhanced with template validation #missionForm.invalid)
    if (!this.missionDestination || !this.missionStartDate || !this.missionEndDate ||
        this.missionDistance === null || this.missionDistance < 0 || !this.missionStatus ||
        !this.missionVehicleID || !this.missionDriverID) {
        this.showNotification('Please fill all required fields correctly.', 'error');
        return;
    }

    if (this.isEditing) {
      this.updateMission();
    } else {
      this.addMission();
    }
  }

  addMission(): void {
    this.loading = true; // Indicate action in progress
    this.cdr.markForCheck();

    // Format dates before sending
    const formattedStartDate = this.datePipe.transform(this.missionStartDate, 'yyyy-MM-ddTHH:mm:ss') || '';
    const formattedEndDate = this.datePipe.transform(this.missionEndDate, 'yyyy-MM-ddTHH:mm:ss') || '';

    const newRecord: Omit<IMission, 'id'> = { // Type without ID for creation
      destination: this.missionDestination,
      startDate: new Date(formattedStartDate), // Send as Date objects or formatted strings as needed by backend
      endDate: new Date(formattedEndDate),
      distance: this.missionDistance!,
      status: this.missionStatus,
      vehicleID: this.missionVehicleID!,
      driverID: this.missionDriverID!
    };

    this.missionsService.createMission(newRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false; // Action finished
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (record) => {
                this.allMissions.unshift(record); // Add to beginning of master list
                this.applyFilters();          // Update table data
                this.showAddForm = false;     // Close form
                this.resetForm();             // Clear form fields
                this.showNotification('Mission added successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error adding mission:', error);
                this.showNotification('Failed to add mission.', 'error');
                // Keep form open on error? Optional.
            }
    });
  }

  editMission(mission: IMission): void {
    this.selectedMission = { ...mission }; // Store the original mission being edited
    this.isEditing = true;

    // Populate form fields
    this.missionDestination = mission.destination;
    // Ensure dates are Date objects for the date picker
    try {
        this.missionStartDate = mission.startDate ? new Date(mission.startDate) : null;
        this.missionEndDate = mission.endDate ? new Date(mission.endDate) : null;
    } catch (e) {
        console.error("Error parsing date for editing:", e);
        this.missionStartDate = null;
        this.missionEndDate = null;
        this.showNotification('Could not parse mission dates.', 'error');
    }
    this.missionDistance = mission.distance;
    this.missionStatus = mission.status;
    this.missionVehicleID = mission.vehicleID;
    this.missionDriverID = mission.driverID;

    this.showAddForm = true; // Show the form
    this.cdr.markForCheck();
  }

  updateMission(): void {
     if (!this.selectedMission || this.selectedMission.id === undefined) {
        this.showNotification('Cannot update: Original mission ID missing.', 'error');
        return;
    }
    // Validation handled by submitMissionForm

    this.loading = true; // Indicate action in progress
    this.cdr.markForCheck();

    // Format dates before sending
    const formattedStartDate = this.datePipe.transform(this.missionStartDate, 'yyyy-MM-ddTHH:mm:ss') || '';
    const formattedEndDate = this.datePipe.transform(this.missionEndDate, 'yyyy-MM-ddTHH:mm:ss') || '';

    const updatedRecord: IMission = {
      ...this.selectedMission, // Keep original ID and any unchanged properties
      destination: this.missionDestination,
      startDate: new Date(formattedStartDate),
      endDate: new Date(formattedEndDate),
      distance: this.missionDistance!,
      status: this.missionStatus,
      vehicleID: this.missionVehicleID!,
      driverID: this.missionDriverID!
    };

    this.missionsService.updateMission(this.selectedMission.id, updatedRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false; // Action finished
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (updatedFromServer) => { // Assuming backend returns the updated mission
                const index = this.allMissions.findIndex(m => m.id === this.selectedMission?.id);
                if (index !== -1) {
                    this.allMissions[index] = updatedFromServer; // Update master list
                }
                this.applyFilters();      // Update table data
                this.showAddForm = false; // Close form
                this.resetForm();         // Clear form fields and editing state
                this.showNotification('Mission updated successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error updating mission:', error);
                this.showNotification('Failed to update mission.', 'error');
                 // Keep form open on error? Optional.
            }
    });
  }

  updateStatus(mission: IMission, newStatus: string): void {
    // Indicate loading specifically for this row/action if possible, otherwise use general 'loading'
    this.loading = true;
    this.cdr.markForCheck();

    const updatedMissionData: Partial<IMission> = { status: newStatus }; // Send only status

    this.missionsService.updateMission(mission.id!, { ...mission, ...updatedMissionData })
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
          })
      )
      .subscribe({
        next: (updatedFromServer) => {
          // Find and update the mission in the master list
          const index = this.allMissions.findIndex(m => m.id === mission.id);
          if (index !== -1) {
            // Update only the status, keeping other potentially unsynced data if backend only returns status
            // Or replace with updatedFromServer if it returns the full object
            this.allMissions[index] = { ...this.allMissions[index], ...updatedFromServer };
          }
          this.applyFilters(); // Re-apply filters to update dataSource
          this.showNotification(`Mission status updated to ${newStatus}`, 'success');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error updating mission status:', error);
          this.showNotification('Failed to update mission status.', 'error');
          // Revert dropdown change visually if needed? (More complex)
          this.fetchMissions(); // Re-fetch to ensure consistency on error
        }
      });
  }

   cancelEdit(): void {
    this.showAddForm = false; // Hide the form
    this.resetForm();       // Clear form fields and editing state
    this.cdr.markForCheck();
  }

  confirmDelete(id: number | undefined): void {
     if (id === undefined) {
         this.showNotification('Cannot delete: Mission ID is missing.', 'error');
         return;
     };
     // Consider using MatDialog for confirmation later
    if (!confirm('Are you sure you want to delete this mission?')) return;

    this.deleteMission(id);
  }

  deleteMission(id: number): void {
    this.loading = true; // Indicate action in progress
    this.cdr.markForCheck();

    this.missionsService.deleteMission(id)
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
          })
       )
      .subscribe({
        next: () => {
          this.allMissions = this.allMissions.filter(m => m.id !== id); // Remove from master list
          this.applyFilters(); // Update table data
          this.showNotification('Mission deleted successfully!', 'success');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error deleting mission:', error);
          this.showNotification('Failed to delete mission.', 'error');
        }
      });
  }

  // --- Filtering & Sorting ---

  applyFilters(): void {
    let filteredData = [...this.allMissions];

    // Apply text filters (case-insensitive)
    if (this.filterDestination) {
        const destLower = this.filterDestination.toLowerCase();
        filteredData = filteredData.filter(m => m.destination.toLowerCase().includes(destLower));
    }
    if (this.filterVehicle) {
        const vehicleLower = this.filterVehicle.toLowerCase();
        filteredData = filteredData.filter(m => this.getVehicleModel(m.vehicleID).toLowerCase().includes(vehicleLower));
    }
    if (this.filterUsername) {
        const userLower = this.filterUsername.toLowerCase();
        // Important: Ensure driver usernames are loaded or being loaded for filtering to work correctly
        filteredData = filteredData.filter(m => this.getDriverUsername(m.driverID).toLowerCase().includes(userLower));
    }

    // Apply date filters
    if (this.filterStartDate) {
        const start = new Date(this.filterStartDate);
        start.setHours(0, 0, 0, 0); // Start of day
        filteredData = filteredData.filter(m => new Date(m.startDate) >= start);
    }
    if (this.filterEndDate) {
        const end = new Date(this.filterEndDate);
        end.setHours(23, 59, 59, 999); // End of day
        filteredData = filteredData.filter(m => new Date(m.endDate) <= end);
    }

    // Apply status filter
    if (this.filterStatus && this.filterStatus !== 'All') {
        filteredData = filteredData.filter(m => m.status.toLowerCase() === this.filterStatus.toLowerCase());
    }

    // Apply sorting
    filteredData.sort((a, b) => {
        const distA = a.distance ?? 0;
        const distB = b.distance ?? 0;
        return this.sortDistanceAsc ? distA - distB : distB - distA;
    });


    // Update the MatTableDataSource
    this.dataSource.data = filteredData;

    // If using paginator, go to first page after filtering
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    this.cdr.markForCheck(); // Notify Angular of changes
  }

  resetFilters(): void {
    // Clear filter properties
    this.filterDestination = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterStatus = ''; // Reset to 'All' (empty string)
    this.filterVehicle = '';
    this.filterUsername = '';
    this.sortDistanceAsc = true; // Reset sort direction
    // Re-apply filters with empty values
    this.applyFilters();
  }

  toggleDistanceSort(): void {
    this.sortDistanceAsc = !this.sortDistanceAsc;
    this.applyFilters(); // Re-apply filters to sort
  }

  // --- Clear Filter Methods ---
  clearFilterDestination(): void { this.filterDestination = ''; this.applyFilters(); }
  clearFilterStartDate(): void { this.filterStartDate = null; this.applyFilters(); }
  clearFilterEndDate(): void { this.filterEndDate = null; this.applyFilters(); }
  clearFilterStatus(): void { this.filterStatus = ''; this.applyFilters(); }
  clearFilterVehicle(): void { this.filterVehicle = ''; this.applyFilters(); }
  clearFilterUsername(): void { this.filterUsername = ''; this.applyFilters(); }

  // --- UI Helpers ---

  // Opens Driver Details Dialog
  openDriverDetails(mission: IMission): void {
    const driver = this.drivers.find(d => d.id === mission.driverID);
    if (driver) {
      this.dialog.open(DriverDetailsDialogComponent, { // Ensure this dialog component exists and is imported
        width: '450px', // Adjust size as needed
        data: driver // Pass driver data to the dialog
      });
    } else {
        this.showNotification('Driver details not found.', 'error');
    }
  }

  // Opens Car Details Dialog
  openCarDetails(mission: IMission): void {
    const vehicle = this.vehicles.find(v => v.id === mission.vehicleID);
    if (vehicle) {
      this.dialog.open(CarDetailsDialogComponent, { // Ensure this dialog component exists and is imported
        width: '550px', // Adjust size as needed
        data: vehicle // Pass vehicle data to the dialog
      });
    } else {
        this.showNotification('Vehicle details not found.', 'error');
    }
  }

   // Get CSS class for mission status badge/row (refining previous approach)
  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-unknown';
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }


  // Helper for showing snackbar notifications
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'], // Use array for panelClass
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

   // --- Calculated Stats Getters ---
   get totalRecordsCount(): number {
    return this.allMissions.length;
  }

   get displayedCount(): number {
       // Use dataSource.filteredData length if using built-in filtering,
       // or dataSource.data.length if using custom filtering like applyFilters()
       return this.dataSource.data.length;
   }

   // Add more stats if needed (e.g., completed missions, total distance)
   get completedMissionsCount(): number {
       return this.allMissions.filter(m => m.status.toLowerCase() === 'completed').length;
   }

}