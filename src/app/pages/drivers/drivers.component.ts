// --- Core Angular Modules ---
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Provides *ngIf, *ngFor, etc.
import { FormsModule } from '@angular/forms'; // Enables template-driven forms and [(ngModel)]

// --- Angular Material Modules ---
// Import specific Material components used in the template for features like
// tables, cards, buttons, form fields, icons, menus, etc.
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';

// --- Application Specific Imports ---
// Interfaces define the data structures used within the component
import { IDriver } from 'src/app/interfaces/IDriver';
import { IUser } from 'src/app/interfaces/IUser';
import { ICars } from 'src/app/interfaces/ICars';
// Services encapsulate data access and business logic related to entities
import { DriverService } from 'src/app/services/Driver.service';
import { UserService } from 'src/app/services/UserService.service';
import { AuthService } from 'src/app/services/AuthService.Service'; // Handles user authentication/registration
import { CarsService } from 'src/app/services/Cars.service';

// --- RxJS Operators ---
// Used for managing asynchronous data streams from services
import { finalize, switchMap, delay, map } from 'rxjs/operators';

@Component({
  selector: 'app-driver',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
  standalone: true, // Manages its own dependencies via the 'imports' array
  imports: [
    // List all modules required by the component's template
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
    MatRadioModule
  ]
})
export class DriversComponent implements OnInit {
  // --- Data Stores ---
  drivers: IDriver[] = [];
  users: IUser[] = []; // Potential users for driver roles
  cars: ICars[] = [];   // Available vehicles

  // --- UI State & Control ---
  errorMessage: string = '';
  showAddForm: boolean = false; // Toggles the add/edit form visibility
  isEditing: boolean = false;   // Tracks if the form is in 'edit' mode
  selectedDriver: IDriver | null = null; // Holds the driver being edited
  isProcessing: boolean = false; // Prevents concurrent API requests (e.g., form submit spam)
  filtersExpanded: boolean = false; // Toggles filter section visibility

  // --- Form Fields (bound with [(ngModel)]) ---
  licenseNumber: string = '';
  phoneNumber: string = '';
  status: string = ''; // Driver status ('Active', 'Suspended')
  userId: number | null = null; // Linked user ID
  affectedVehicleID: number | null = null; // Assigned vehicle ID

  // --- New User Creation Fields (used when adding a driver AND a new user) ---
  addNewUser: boolean = false; // Flag to trigger user creation flow
  newUserUsername: string = '';
  newUserEmail: string = '';
  newUserPassword: string = '';
  readonly driverRoleId: number = 2; // Hardcoded role ID for 'Driver'

  // --- Filtering ---
  filterUsername: string = '';
  filterStatus: string = '';
  filterLicenseNumber: string = '';
  readonly availableStatuses: string[] = ['All', 'Active', 'Suspended']; // Options for status filter

  // --- Table Configuration ---
  displayedColumns: string[] = [ 'licenseNumber', 'phoneNumber', 'status-actions', 'user', 'vehicle', 'actions'];
  dataSource = new MatTableDataSource<IDriver>(this.drivers); // Connects driver data to the table

  // --- Lookups for Display ---
  // Caches for efficient display of related entity names/details in the table
  userNames: { [key: number]: string } = {};
  vehicleDetails: { [key: number]: { licensePlate: string, brand: string, model: string } } = {};

  constructor(
    // Inject services needed for data operations and UI feedback
    private driverService: DriverService,
    private userService: UserService,
    private authService: AuthService,
    private carsService: CarsService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Fetch initial data required for the component on load.
   */
  ngOnInit(): void {
    this.fetchDrivers();
    this.fetchDriverUsers(); // Fetch users eligible to be drivers for dropdowns/lookups
    this.fetchCars();      // Fetch vehicles for dropdowns/lookups
  }

  /**
   * Fetches all drivers, updates the local array and table datasource.
   */
  fetchDrivers(): void {
    this.driverService.getAllDrivers().subscribe({
      next: (drivers) => {
        this.drivers = drivers;
        this.dataSource.data = this.drivers;
        this.applyFilters(); // Ensure filters are applied to newly fetched data
      },
      error: (error) => {
        console.error('Error fetching drivers:', error);
        this.errorMessage = 'Error fetching driver records.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  /**
   * Fetches users with the 'Driver' role to populate selection dropdowns
   * and the username lookup map.
   */
  fetchDriverUsers(): void {
    this.userService.getUsersByRoleDriver().subscribe({
      next: (users) => {
        this.users = users;
        // Build the username lookup map
        this.userNames = users.reduce((acc, user) => {
          if (user.id) acc[user.id] = user.username;
          return acc;
        }, {} as { [key: number]: string });
      },
      error: (error) => console.error('Error fetching driver users:', error) // Log error, potentially show less critical message
    });
  }

  /**
   * Fetches all cars to populate selection dropdowns and the vehicle details lookup map.
   */
  fetchCars(): void {
    this.carsService.getAllVehicles().subscribe({
      next: (cars) => {
        this.cars = cars;
        // Build the vehicle details lookup map
        this.vehicleDetails = cars.reduce((acc, car) => {
          if (car.id) {
            acc[car.id] = {
              licensePlate: car.licensePlate,
              brand: car.brand || 'N/A', // Handle potential missing data
              model: car.model || 'N/A'
            };
          }
          return acc;
        }, {} as { [key: number]: { licensePlate: string, brand: string, model: string } });
      },
      error: (error) => console.error('Error fetching cars:', error) // Log error
    });
  }

  /**
   * Gets the username from the cache based on user ID. Used for table display.
   */
  getUserName(userId: number): string {
    return this.userNames[userId] || 'Unknown User'; // Provide a fallback
  }

  /**
   * Gets formatted vehicle details string from the cache. Used for table display.
   */
  getVehicleDetails(vehicleId?: number): string {
    if (!vehicleId || !this.vehicleDetails[vehicleId]) {
      return 'Not Assigned';
    }
    const { brand, model, licensePlate } = this.vehicleDetails[vehicleId];
    return `${brand} ${model} (${licensePlate})`;
  }

  /**
   * Checks if a vehicle is currently assigned to *any* driver in the list.
   * Used for validation before assigning a vehicle.
   */
  isVehicleAssigned(vehicleId: number): boolean {
    return this.drivers.some(driver => driver.affectedVehicleID === vehicleId);
  }

  /**
   * Handles adding a new driver, potentially creating a new associated user first.
   * Includes validation and state updates.
   */
  addDriver(): void {
    if (this.isProcessing) return;

    // --- Input Validation ---
    if (!this.licenseNumber || !this.phoneNumber || !this.status) {
      this.snackBar.open('Driver License, Phone, and Status are required.', 'Close', { duration: 3000 });
      return;
    }
    // Business Rule: Suspended drivers can't have vehicles
    if (this.status === 'Suspended' && this.affectedVehicleID !== null) {
      this.snackBar.open('Suspended drivers cannot be assigned a vehicle.', 'Close', { duration: 3000 });
      return;
    }
    // Business Rule: Vehicle uniqueness check (for new assignments)
    if (this.affectedVehicleID && this.isVehicleAssigned(this.affectedVehicleID)) {
      this.snackBar.open('This vehicle is already assigned.', 'Close', { duration: 3000 });
      return;
    }

    this.isProcessing = true;

    // --- Conditional Logic: Add New User or Use Existing ---
    if (this.addNewUser) {
      // --- Flow: Register User -> Find New User -> Create Driver ---
      if (!this.newUserUsername || !this.newUserEmail || !this.newUserPassword) {
        this.snackBar.open('Username, Email, and Password are required for new user.', 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }

      this.authService.register(this.newUserUsername, this.newUserPassword, this.newUserEmail, this.driverRoleId)
        .pipe(
          delay(1000), // Short delay: Allow potential eventual consistency on backend after registration
          switchMap(() => this.userService.getAllUsers()), // Fetch users again to find the new one
          map((allUsers: IUser[]) => {
            const newUser = allUsers.find((u: IUser) => u.email === this.newUserEmail); // Find by email (assuming unique)
            if (!newUser?.id) throw new Error('Failed to find newly registered user.');
            return newUser; // Pass the full user object down
          }),
          switchMap((newUser: IUser) => {
            // Update local user list/cache *before* creating driver
            this.users.push(newUser);
            if(newUser.id) this.userNames[newUser.id] = newUser.username;
            // Now create the driver linked to this new user
            const driverData: IDriver = {
                licenseNumber: this.licenseNumber,
                phoneNumber: this.phoneNumber,
                status: this.status,
                userId: newUser.id!,
                affectedVehicleID: this.affectedVehicleID
            };
            return this.driverService.createDriver(driverData);
          }),
          finalize(() => this.isProcessing = false) // Ensure flag is always reset
        )
        .subscribe({
          next: (createdDriver) => this.handleDriverCreationSuccess(createdDriver, 'User and driver added successfully'),
          error: (err) => this.handleDriverCreationError(err, 'Error creating user/driver')
        });
    } else {
      // --- Flow: Create Driver with Existing User ---
      if (this.userId === null) {
        this.snackBar.open('Please select an existing user.', 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }
      const driverData: IDriver = {
        licenseNumber: this.licenseNumber,
        phoneNumber: this.phoneNumber,
        status: this.status,
        userId: this.userId,
        affectedVehicleID: this.affectedVehicleID
      };
      this.driverService.createDriver(driverData)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
            next: (createdDriver) => this.handleDriverCreationSuccess(createdDriver, 'Driver added successfully'),
            error: (err) => this.handleDriverCreationError(err, 'Error adding driver')
        });
    }
  }

  // Helper for successful driver creation logic
  private handleDriverCreationSuccess(driver: IDriver, message: string): void {
    this.drivers.push(driver);
    this.dataSource.data = this.drivers; // Refresh table
    this.showAddForm = false;
    this.applyFilters();
    this.resetForm();
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  // Helper for driver creation error logic
  private handleDriverCreationError(error: any, defaultMessage: string): void {
      console.error(defaultMessage + ':', error);
      // Attempt to provide a more specific error from backend if available
      const detail = error?.message || error?.error?.message || defaultMessage;
      this.snackBar.open(detail, 'Close', { duration: 4000 });
      // If user creation might have succeeded but driver failed, refresh user list
      if (this.addNewUser) this.fetchDriverUsers();
  }


  /**
   * Sets up the form for editing an existing driver record.
   */
  editDriver(driver: IDriver): void {
    this.selectedDriver = driver;
    this.isEditing = true;
    this.showAddForm = true;
    this.addNewUser = false; // Can't switch to add new user during edit

    // Pre-fill form fields
    this.licenseNumber = driver.licenseNumber;
    this.phoneNumber = driver.phoneNumber;
    this.status = driver.status;
    this.userId = driver.userId; // User selection should be disabled or handled carefully
    this.affectedVehicleID = driver.affectedVehicleID ?? null; // Use null if undefined/null
  }

  /**
   * Submits updates for the currently selected driver.
   */
  updateDriver(): void {
    if (this.isProcessing || !this.selectedDriver?.id) return;

    // --- Input Validation ---
    // Business Rule: Suspended drivers can't have vehicles
    if (this.status === 'Suspended' && this.affectedVehicleID !== null) {
      this.snackBar.open('Suspended drivers cannot be assigned a vehicle.', 'Close', { duration: 3000 });
      return;
    }
    // Business Rule: Vehicle uniqueness check (only if vehicle changed)
    const vehicleChanged = this.selectedDriver.affectedVehicleID !== this.affectedVehicleID;
    if (vehicleChanged && this.affectedVehicleID && this.isVehicleAssigned(this.affectedVehicleID)) {
       this.snackBar.open('This vehicle is already assigned to another driver.', 'Close', { duration: 3000 });
       return;
    }

    this.isProcessing = true;

    const updatedDriverData: IDriver = {
      ...this.selectedDriver, // Include existing ID and other fields
      // Apply form values
      licenseNumber: this.licenseNumber,
      phoneNumber: this.phoneNumber,
      status: this.status,
      userId: this.userId!, // Assume userId is non-null when editing
      affectedVehicleID: this.affectedVehicleID
    };

    this.driverService.updateDriver(this.selectedDriver.id, updatedDriverData)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: (updatedDriver) => { // API might return the updated object
          const index = this.drivers.findIndex(d => d.id === updatedDriver.id);
          if (index !== -1) {
            this.drivers[index] = updatedDriver; // Update local data
            this.dataSource.data = [...this.drivers]; // Create new array reference to trigger change detection
            this.applyFilters();
          }
          this.cancelEdit(); // Close form, reset state
          this.snackBar.open('Driver updated successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error updating driver:', error);
          this.snackBar.open('Error updating driver', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Updates *only* the status of a driver, typically triggered from the table actions.
   * Includes logic to auto-unassign vehicle if suspended.
   */
  updateDriverStatus(driver: IDriver, newStatus: string): void {
    if (this.isProcessing || !driver.id) return;
    this.isProcessing = true;

    let vehicleUpdateNeeded = false;
    let updatedVehicleId: number | null | undefined = driver.affectedVehicleID;

    // Business Rule: If suspending, automatically unassign vehicle
    if (newStatus === 'Suspended' && driver.affectedVehicleID !== null) {
      updatedVehicleId = null;
      vehicleUpdateNeeded = true;
       console.warn(`Vehicle will be unassigned from driver ${driver.id} due to suspension.`);
    }

    // Minimal update payload, only sending changed fields
    const updatePayload: Partial<IDriver> = { status: newStatus };
    if (vehicleUpdateNeeded) {
        updatePayload.affectedVehicleID = updatedVehicleId;
    }

    // Use the updateDriver endpoint
    this.driverService.updateDriver(driver.id, updatePayload as IDriver) // Cast needed if service expects full IDriver
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: (updatedDriver) => { // Expect the full updated driver from the API
          const index = this.drivers.findIndex(d => d.id === driver.id);
          if (index !== -1) {
            this.drivers[index] = updatedDriver; // Update local data with API response
            this.dataSource.data = [...this.drivers]; // Trigger change detection
            this.applyFilters();
          }
          this.snackBar.open(`Driver status updated to ${newStatus}`, 'Close', { duration: 3000 });
          if (vehicleUpdateNeeded) {
             this.snackBar.open('Vehicle was unassigned due to suspension.', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error updating driver status:', error);
          this.snackBar.open('Error updating driver status', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Updates *only* the vehicle assignment for a driver, using dedicated service methods.
   */
  updateVehicleAssignment(driver: IDriver, vehicleId: number | null): void {
      if (this.isProcessing || !driver.id) return;

      // --- Validation ---
      if (driver.status === 'Suspended' && vehicleId !== null) {
          this.snackBar.open('Suspended drivers cannot be assigned a vehicle.', 'Close', { duration: 3000 });
          return;
      }
      if (vehicleId && this.isVehicleAssigned(vehicleId) && driver.affectedVehicleID !== vehicleId) {
          this.snackBar.open('This vehicle is already assigned to another driver.', 'Close', { duration: 3000 });
          return;
      }

      this.isProcessing = true;
      // Choose the appropriate service call based on whether vehicleId is null
      const operation = vehicleId === null
          ? this.driverService.removeVehicle(driver.id) // Use remove endpoint
          : this.driverService.assignVehicle(driver.id, vehicleId); // Use assign endpoint

      operation.pipe(finalize(() => this.isProcessing = false))
          .subscribe({
              next: (updatedDriver) => {
                  const index = this.drivers.findIndex(d => d.id === driver.id);
                  if (index !== -1) {
                      this.drivers[index] = updatedDriver; // Update local data
                      this.dataSource.data = [...this.drivers]; // Trigger change detection
                      this.applyFilters();
                  }
                  const message = vehicleId === null ? 'Vehicle removed successfully' : 'Vehicle assigned successfully';
                  this.snackBar.open(message, 'Close', { duration: 3000 });
              },
              error: (error) => {
                  const action = vehicleId === null ? 'removing' : 'assigning';
                  console.error(`Error ${action} vehicle:`, error);
                  this.snackBar.open(`Error ${action} vehicle`, 'Close', { duration: 3000 });
              }
          });
  }


  /**
   * Deletes a driver record by ID.
   */
  deleteDriver(id: number): void {
    if (this.isProcessing) return;

    // Optional: Add a confirmation dialog here (e.g., using MatDialog) before proceeding
    // if (!confirm(`Are you sure you want to delete driver ${this.getUserName(this.drivers.find(d=>d.id===id)!.userId)}?`)) {
    //   return;
    // }

    this.isProcessing = true;

    this.driverService.deleteDriver(id)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => {
          // Remove from local array and update table
          this.drivers = this.drivers.filter(driver => driver.id !== id);
          this.dataSource.data = this.drivers; // No need for [...] here, filter creates new array
          this.applyFilters();
          this.snackBar.open('Driver deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting driver:', error);
          // Check for specific errors, e.g., dependencies preventing deletion
          const message = error?.error?.message || 'Error deleting driver';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        }
      });
  }

  /**
   * Cancels the add/edit operation, hides the form, and resets state.
   */
  cancelEdit(): void {
    this.showAddForm = false;
    this.isEditing = false;
    this.selectedDriver = null;
    this.resetForm();
  }

  /**
   * Resets all form fields to their initial/empty state. Private helper.
   */
  private resetForm(): void {
    this.licenseNumber = '';
    this.phoneNumber = '';
    this.status = ''; // Consider setting a default status if applicable
    this.userId = null;
    this.affectedVehicleID = null;
    this.addNewUser = false;
    this.newUserUsername = '';
    this.newUserEmail = '';
    this.newUserPassword = '';
  }

  /**
   * Filters the table data based on the current filter criteria using MatTableDataSource's filtering.
   */
  applyFilters(): void {
    // Prepare filter values, trimming and lowercasing for case-insensitive matching
    const filterValues = {
        username: this.filterUsername.trim().toLowerCase(),
        status: this.filterStatus ? this.filterStatus.toLowerCase() : 'all', // Handle empty status filter as 'all'
        license: this.filterLicenseNumber.trim().toLowerCase()
    };

    // Define the custom filter predicate. This function runs for each row.
    this.dataSource.filterPredicate = (data: IDriver, filter: string): boolean => {
        // filter is the stringified JSON of filterValues passed below
        const searchTerms = JSON.parse(filter);

        // Check each filter criterion. Return true only if all active criteria match.
        const usernameMatch = searchTerms.username
            ? this.getUserName(data.userId).toLowerCase().includes(searchTerms.username)
            : true; // No username filter applied

        const statusMatch = (searchTerms.status && searchTerms.status !== 'all')
            ? data.status.toLowerCase() === searchTerms.status
            : true; // 'All' or no status filter applied

        const licenseMatch = searchTerms.license
            ? data.licenseNumber.toLowerCase().includes(searchTerms.license)
            : true; // No license filter applied

        return usernameMatch && statusMatch && licenseMatch;
    };

    // Trigger the filtering process by assigning the filter value (as a JSON string)
    // This causes MatTableDataSource to run the filterPredicate for each row.
    this.dataSource.filter = JSON.stringify(filterValues);

    // If using pagination, reset to the first page after filtering
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


  /**
   * Clears all filter inputs and refreshes the table to show all data.
   */
  resetFilters(): void {
    this.filterUsername = '';
    this.filterStatus = ''; // Reset to empty (which applyFilters handles as 'all')
    this.filterLicenseNumber = '';
    this.applyFilters(); // Re-apply empty filters
  }

  /**
   * Updates the form's status model when the selection changes in the UI.
   * Example: bound to (ngModelChange) or (change) event in the template.
   */
  onStatusChange(newStatus: string): void {
    this.status = newStatus;
    // console.log('Form status model changed to:', newStatus); // Debugging if needed
  }
}