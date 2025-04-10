// --- Core Angular Modules ---
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Angular Material Modules ---
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Added MatSnackBarModule
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // Import MatPaginator
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// --- Application Specific Imports ---
import { IDriver } from 'src/app/interfaces/IDriver'; // Adjust path as needed
import { IUser } from 'src/app/interfaces/IUser';     // Adjust path as needed
import { ICars } from 'src/app/interfaces/ICars';     // Adjust path as needed
import { DriverService } from 'src/app/services/Driver.service'; // Adjust path as needed
import { UserService } from 'src/app/services/UserService.service'; // Adjust path as needed
import { AuthService } from 'src/app/services/AuthService.Service'; // Adjust path as needed
import { CarsService } from 'src/app/services/Cars.service';     // Adjust path as needed

// --- RxJS Operators ---
import { finalize, switchMap, delay, map, catchError, Subject, takeUntil, of } from 'rxjs';

@Component({
  selector: 'app-driver', // Or your original selector 'app-drivers'
  templateUrl: './drivers.component.html',
  // Use styleUrls if you have a separate SCSS/CSS file, otherwise remove
   styleUrls: ['./drivers.component.scss'],
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
    MatMenuModule,
    MatRadioModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule // Make sure MatSnackBarModule is imported
  ]
})
export class DriversComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Data Stores ---
  private allDrivers: IDriver[] = []; // Store the full list for client-side filtering
  users: IUser[] = [];
  cars: ICars[] = [];

  // --- UI State & Control ---
  errorMessage: string = '';
  showAddForm: boolean = false;
  isEditing: boolean = false;
  isProcessing: boolean = false;
  filtersExpanded: boolean = false;
  isLoadingData: boolean = true;

  // --- Form Fields ---
  licenseNumber: string = '';
  phoneNumber: string = '';
  status: string = ''; // Use string type consistent with template bindings
  userId: number | null = null;
  affectedVehicleID: number | null = null;
  selectedDriverId: number | null = null;

  // --- New User Creation Fields ---
  addNewUser: boolean = false;
  newUserUsername: string = '';
  newUserEmail: string = '';
  newUserPassword: string = '';
  readonly driverRoleId: number = 2; // Assuming Role ID 2 is Driver

  // --- Filtering ---
  filterUsername: string = '';
  filterStatus: string = ''; // Default to '' which means 'All'
  filterLicenseNumber: string = '';
  readonly availableStatuses: string[] = ['All', 'Active', 'Suspended'];

  // --- Table Configuration ---
  // Ensure 'id' is included if you have it in your original template, otherwise remove
  // displayedColumns: string[] = ['id', 'licenseNumber', 'phoneNumber', 'status-actions', 'user', 'vehicle', 'actions'];
  displayedColumns: string[] = [ 'licenseNumber', 'phoneNumber', 'status-actions', 'user', 'vehicle', 'actions']; 
  dataSource = new MatTableDataSource<IDriver>([]);

  // --- Pagination ---
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10; // Default items per page
  pageSizeOptions: number[] = [5, 10, 25, 100];

  // --- Lookups for Display ---
  userNames: { [key: number]: string } = {};

  // --- Unsubscription ---
  private destroy$ = new Subject<void>();

  constructor(
    private driverService: DriverService,
    private userService: UserService,
    private authService: AuthService,
    private carsService: CarsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoadingData = true;
    this.setupFilterPredicate();
    this.fetchAllInitialData();
  }

  ngAfterViewInit(): void {
    // Assign the paginator to the data source
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchAllInitialData(): void {
    this.isLoadingData = true;
    // Fetch users and cars first or in parallel
    const users$ = this.userService.getUsersByRoleDriver().pipe(
        takeUntil(this.destroy$),
        catchError(error => {
            console.error('Error fetching driver users:', error);
            return of([]); // Continue even if users fail to load
        })
    );

    const cars$ = this.carsService.getAllVehicles().pipe(
        takeUntil(this.destroy$),
        catchError(error => {
            console.error('Error fetching cars:', error);
            return of([]); // Continue even if cars fail to load
        })
    );

    // Fetch Drivers after getting users/cars data needed for lookups/display
    users$.pipe(
        switchMap(users => {
            this.processUsers(users); // Process users to build username map
            return cars$; // Chain to fetch cars
        }),
        switchMap(cars => {
            this.processCars(cars); // Process cars
            return this.driverService.getAllDrivers(); // Now fetch drivers
        }),
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingData = false)
    ).subscribe({
        next: (drivers) => {
            this.allDrivers = drivers;
            this.dataSource.data = this.allDrivers; // Assign data
            this.applyFilters(); // Apply default filters
        },
        error: (error) => {
            console.error('Error fetching drivers:', error);
            this.errorMessage = 'Error fetching driver records.';
            this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
    });
  }

  private processUsers(users: IUser[]): void {
    this.users = users;
    this.userNames = users.reduce((acc, user) => {
        if (user.id) acc[user.id] = user.username;
        return acc;
    }, {} as { [key: number]: string });
  }

  private processCars(cars: ICars[]): void {
    this.cars = cars;
    // No vehicleDetails map needed for the original HTML structure
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: IDriver, filter: string): boolean => {
      try {
        const searchTerms = JSON.parse(filter);
        const username = this.getUserName(data.userId)?.toLowerCase() ?? ''; // Handle undefined user

        const usernameMatch = searchTerms.username
          ? username.includes(searchTerms.username)
          : true;

        const statusMatch = (searchTerms.status && searchTerms.status !== 'all')
          ? data.status.toLowerCase() === searchTerms.status
          : true;

        const licenseMatch = searchTerms.license
          ? data.licenseNumber.toLowerCase().includes(searchTerms.license)
          : true;

        return usernameMatch && statusMatch && licenseMatch;
      } catch (e) {
        console.error("Error parsing filter JSON:", e);
        return true;
      }
    };
  }

  applyFilters(): void {
    const filterValues = {
      username: this.filterUsername.trim().toLowerCase(),
      status: this.filterStatus && this.filterStatus !== 'All' ? this.filterStatus.toLowerCase() : '',
      license: this.filterLicenseNumber.trim().toLowerCase()
    };
    this.dataSource.filter = JSON.stringify(filterValues);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters(): void {
    this.filterUsername = '';
    this.filterStatus = '';
    this.filterLicenseNumber = '';
    this.applyFilters();
  }

  getUserName(userId: number): string | undefined {
    return this.userNames[userId];
  }

  // No getVehicleDetails needed based on original HTML structure

  /** Checks if a vehicle is assigned to any *other* driver. */
  isVehicleAssigned(vehicleId: number): boolean {
    // Always exclude the current driver (either in edit mode or in table)
    const driverIdToExclude = this.isEditing ? this.selectedDriverId :
                             this.allDrivers.find(d => d.affectedVehicleID === vehicleId)?.id;
    return this.allDrivers.some(driver =>
        driver.id !== driverIdToExclude &&
        driver.affectedVehicleID === vehicleId
    );
  }

  // --- CRUD Operations (Simplified for Brevity - Use logic from previous full example) ---

  addDriver(): void {
    if (this.isProcessing) return;
    // --- Add Validation ---
    if (!this.licenseNumber || !this.phoneNumber || !this.status) {
        this.snackBar.open('License, Phone, and Status are required.', 'Close', { duration: 3000 }); return;
    }
    if (this.status === 'Suspended' && this.affectedVehicleID !== null) {
        this.snackBar.open('Suspended drivers cannot have a vehicle.', 'Close', { duration: 3000 }); return;
    }
    if (this.affectedVehicleID && this.isVehicleAssigned(this.affectedVehicleID)) {
         this.snackBar.open('Vehicle already assigned.', 'Close', { duration: 3000 }); return;
    }
    // --- Combine Add New User / Existing User Logic ---
    this.isProcessing = true;
    let operation$; // Observable for the operation

    if (this.addNewUser) {
        // --- Add New User Flow ---
        if (!this.newUserUsername || !this.newUserEmail || !this.newUserPassword) {
            this.snackBar.open('New user details required.', 'Close', { duration: 3000 }); this.isProcessing = false; return;
        }
        operation$ = this.authService.register(this.newUserUsername, this.newUserPassword, this.newUserEmail, this.driverRoleId).pipe(
            // delay(500), // Optional delay for consistency
            switchMap(() => this.userService.getAllUsers()), // Fetch users again
            map(allUsers => {
                const newUser = allUsers.find(u => u.email === this.newUserEmail);
                if (!newUser?.id) throw new Error('Failed to find newly registered user.');
                this.users.push(newUser); // Update local users
                if(newUser.id) this.userNames[newUser.id] = newUser.username;
                return newUser.id; // Pass new user ID
            }),
            switchMap(newUserId => {
                const driverData: Partial<IDriver> = { licenseNumber: this.licenseNumber, phoneNumber: this.phoneNumber, status: this.status, userId: newUserId, affectedVehicleID: this.affectedVehicleID };
                return this.driverService.createDriver(driverData as IDriver); // Create driver with new user ID
            })
        );
    } else {
        // --- Existing User Flow ---
        if (!this.userId) {
            this.snackBar.open('Please select an existing user.', 'Close', { duration: 3000 }); this.isProcessing = false; return;
        }
        const driverData: Partial<IDriver> = { licenseNumber: this.licenseNumber, phoneNumber: this.phoneNumber, status: this.status, userId: this.userId, affectedVehicleID: this.affectedVehicleID };
        operation$ = this.driverService.createDriver(driverData as IDriver); // Create driver with existing user ID
    }

    // --- Execute Operation ---
    operation$.pipe(
        finalize(() => this.isProcessing = false),
        takeUntil(this.destroy$)
    ).subscribe({
        next: (createdDriver) => {
            this.allDrivers.push(createdDriver);
            this.dataSource.data = this.allDrivers;
            this.applyFilters();
            this.snackBar.open('Driver added successfully!', 'Close', { duration: 3000 });
            this.cancelEdit();
        },
        error: (err) => {
            console.error("Error adding driver:", err);
            this.snackBar.open(`Error: ${err.message || 'Could not add driver'}`, 'Close', { duration: 5000 });
            // Optional: Refresh user list if user creation succeeded but driver failed
             if (this.addNewUser) this.userService.getUsersByRoleDriver().pipe(takeUntil(this.destroy$)).subscribe(users => this.processUsers(users));
        }
    });
  }

  editDriver(driver: IDriver): void {
    if (!driver.id) return;
    this.isEditing = true;
    this.showAddForm = true;
    this.selectedDriverId = driver.id;
    this.addNewUser = false; // Cannot add new user when editing

    this.licenseNumber = driver.licenseNumber;
    this.phoneNumber = driver.phoneNumber;
    this.status = driver.status;
    this.userId = driver.userId;
    this.affectedVehicleID = driver.affectedVehicleID ?? null;

    // Reset new user fields
    this.newUserUsername = '';
    this.newUserEmail = '';
    this.newUserPassword = '';
  }

  updateDriver(): void {
      if (!this.isEditing || !this.selectedDriverId || this.isProcessing) return;

      // --- Validation ---
      if (this.status === 'Suspended' && this.affectedVehicleID !== null) {
          this.snackBar.open('Suspended drivers cannot have a vehicle.', 'Close', { duration: 3000 });
          return;
      }
      if (this.affectedVehicleID && this.isVehicleAssigned(this.affectedVehicleID)) {
          this.snackBar.open('Vehicle already assigned to another driver.', 'Close', { duration: 3000 });
          return;
      }
      if (!this.userId) {
          this.snackBar.open('User is required.', 'Close', { duration: 3000 });
          return;
      }

      this.isProcessing = true;

      // Store original vehicle ID to check if it changed
      const originalDriver = this.allDrivers.find(d => d.id === this.selectedDriverId);
      const originalVehicleId = originalDriver?.affectedVehicleID;

      // First update basic driver info without vehicle
      const driverData: IDriver = {
          id: this.selectedDriverId,
          licenseNumber: this.licenseNumber,
          phoneNumber: this.phoneNumber,
          status: this.status,
          userId: this.userId,
          affectedVehicleID: originalVehicleId ?? null // Assign null if undefined
      };

      // Update driver basic info first
      this.driverService.updateDriver(this.selectedDriverId, driverData).pipe(
          // Handle vehicle assignment/removal if needed
          switchMap(updatedDriver => {
              // If vehicle assignment changed
              if (this.affectedVehicleID !== originalVehicleId) {
                  if (this.affectedVehicleID === null) {
                      // Remove vehicle
                      return this.driverService.removeVehicle(this.selectedDriverId!).pipe(
                          map(finalDriver => ({ success: true, driver: finalDriver }))
                      );
                  } else {
                      // Assign new vehicle
                      return this.driverService.assignVehicle(this.selectedDriverId!, this.affectedVehicleID).pipe(
                          map(finalDriver => ({ success: true, driver: finalDriver }))
                      );
                  }
              }
              // No vehicle change needed
              return of({ success: true, driver: updatedDriver });
          }),
          finalize(() => this.isProcessing = false),
          takeUntil(this.destroy$)
      ).subscribe({
          next: (result) => {
              const index = this.allDrivers.findIndex(d => d.id === this.selectedDriverId);
              if (index > -1) {
                  this.allDrivers[index] = result.driver;
                  this.dataSource.data = [...this.allDrivers];
                  this.applyFilters();
              }
              this.snackBar.open('Driver updated successfully!', 'Close', { duration: 3000 });
              this.cancelEdit();
          },
          error: (err) => {
              console.error("Error updating driver:", err);
              this.snackBar.open(`Error: ${err.message || 'Could not update driver'}`, 'Close', { duration: 5000 });
          }
      });
  }

  updateDriverStatus(driver: IDriver, newStatus: string): void {
      if (this.isProcessing || !driver.id) return;

      // Validation for suspended status
      if (newStatus === 'Suspended' && driver.affectedVehicleID !== null) {
          this.snackBar.open('Vehicle will be unassigned when status is set to Suspended.', 'Close', { duration: 3000 });
      }

      this.isProcessing = true;
      const updatedDriver: IDriver = {
          ...driver,
          status: newStatus,
          // If suspended, remove vehicle assignment
          affectedVehicleID: newStatus === 'Suspended' ? null : driver.affectedVehicleID
      };

      this.driverService.updateDriver(driver.id, updatedDriver).pipe(
          finalize(() => this.isProcessing = false),
          takeUntil(this.destroy$)
      ).subscribe({
          next: (result) => {
              const index = this.allDrivers.findIndex(d => d.id === driver.id);
              if (index > -1) {
                  this.allDrivers[index] = result;
                  this.dataSource.data = [...this.allDrivers]; // Force refresh
                  this.applyFilters();
              }
              this.snackBar.open(`Driver status updated to ${newStatus}`, 'Close', { duration: 3000 });
              if (newStatus === 'Suspended' && driver.affectedVehicleID !== null) {
                  this.snackBar.open('Vehicle unassigned due to suspension.', 'Close', { duration: 3000 });
              }
          },
          error: (err) => {
              console.error("Error updating status:", err);
              this.snackBar.open(`Error: ${err.message || 'Could not update status'}`, 'Close', { duration: 5000 });
          }
      });
  }

  updateVehicleAssignment(driver: IDriver, vehicleId: number | null): void {
      if (this.isProcessing || !driver.id) return;

      // --- Validation ---
      if (driver.status === 'Suspended' && vehicleId !== null) {
          this.snackBar.open('Suspended drivers cannot have a vehicle.', 'Close', { duration: 3000 });
          return;
      }
      if (vehicleId !== null && this.isVehicleAssigned(vehicleId)) {
          this.snackBar.open('Vehicle already assigned to another driver.', 'Close', { duration: 3000 });
          return;
      }

      this.isProcessing = true;

      // Use assignVehicle or removeVehicle based on whether vehicleId is provided
      const operation$ = vehicleId === null ?
          this.driverService.removeVehicle(driver.id) :
          this.driverService.assignVehicle(driver.id, vehicleId);

      operation$.pipe(
          finalize(() => this.isProcessing = false),
          takeUntil(this.destroy$)
      ).subscribe({
          next: (updatedDriver) => {
              const index = this.allDrivers.findIndex(d => d.id === driver.id);
              if (index > -1) {
                  this.allDrivers[index] = updatedDriver;
                  this.dataSource.data = this.allDrivers;
                  this.applyFilters();
              }
              const msg = vehicleId === null ? 'Vehicle unassigned.' : 'Vehicle assigned.';
              this.snackBar.open(msg, 'Close', { duration: 3000 });
          },
          error: (err) => {
              console.error("Error updating vehicle:", err);
              this.snackBar.open(`Error: ${err.message || 'Could not update vehicle'}`, 'Close', { duration: 5000 });
          }
      });
  }

  deleteDriver(id: number | undefined): void { // Handle potentially undefined ID
    if (!id || this.isProcessing) return;

    // Add Confirmation Dialog Here (Recommended)
    

    this.isProcessing = true;
    this.driverService.deleteDriver(id).pipe(
      finalize(() => this.isProcessing = false),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.allDrivers = this.allDrivers.filter(d => d.id !== id);
        this.dataSource.data = this.allDrivers;
        this.applyFilters();
        this.snackBar.open('Driver deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error("Error deleting driver:", err);
        this.snackBar.open(`Error: ${err.error?.message || err.message || 'Could not delete driver'}`, 'Close', { duration: 5000 });
      }
    });
  }

  cancelEdit(): void {
    this.showAddForm = false;
    this.isEditing = false;
    this.selectedDriverId = null;
    this.resetFormFields();
  }

  public resetFormFields(): void {
    this.licenseNumber = '';
    this.phoneNumber = '';
    this.status = '';
    this.userId = null;
    this.affectedVehicleID = null;
    this.addNewUser = false;
    this.newUserUsername = '';
    this.newUserEmail = '';
    this.newUserPassword = '';
  }

  // Renamed from onStatusChange to avoid conflict if used elsewhere
  onFormStatusSelectChange(newStatus: string): void {
    this.status = newStatus;
    if (newStatus === 'Suspended') {
      this.affectedVehicleID = null; // Unassign vehicle if suspended in form
    }
  }

   // TrackBy function for ngFor loops
   trackById(index: number, item: { id: number | undefined }): number | undefined {
    return item.id;
   }

  // TrackBy function for ngFor loops on users
  trackByUserId(index: number, item: IUser): number | undefined {
    return item.id;
  }
  trackBycarId(index: number, item: ICars): number | undefined {
    return item.id;
  }
}