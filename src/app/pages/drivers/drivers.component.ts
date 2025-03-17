import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IDriver } from 'src/app/interfaces/IDriver';
import { IUser } from 'src/app/interfaces/IUser';
import { DriverService } from 'src/app/services/Driver.service';
import { UserService } from 'src/app/services/UserService.service';
import { AuthService } from 'src/app/services/AuthService.Service';
import { CarsService } from 'src/app/services/Cars.service';
import { ICars } from 'src/app/interfaces/ICars';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { finalize, switchMap, delay, map } from 'rxjs/operators';

@Component({
  selector: 'app-driver',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    MatSelectModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatRadioModule
  ]
})
export class DriversComponent implements OnInit {
  drivers: IDriver[] = [];
  users: IUser[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';
  showAddForm: boolean = false;
  isEditing: boolean = false;
  selectedDriver: IDriver | null = null;
  isProcessing: boolean = false;

  // Form fields for driver
  licenseNumber: string = '';
  phoneNumber: string = '';
  status: string = '';
  userId: number | null = null;
  affectedVehicleID: number | null = null;

  // New properties for adding a user
  addNewUser: boolean = false;
  newUserUsername: string = '';
  newUserEmail: string = '';
  newUserPassword: string = '';
  driverRoleId: number = 2; // Assuming roleId 2 is for "Driver"

  // Filter properties
  filterUsername: string = '';
  filterStatus: string = '';
  filterLicenseNumber: string = '';
  availableStatuses: string[] = ['All', 'Active', 'Suspended'];
  filtersExpanded: boolean = false;

  displayedColumns: string[] = [ 'licenseNumber', 'phoneNumber', 'status-actions', 'user', 'vehicle', 'actions']; // Updated displayedColumns
  dataSource = new MatTableDataSource<IDriver>(this.drivers);

  userNames: { [key: number]: string } = {};
  vehicleDetails: { [key: number]: { licensePlate: string, brand: string, model: string } } = {};

  constructor(
    private driverService: DriverService,
    private userService: UserService,
    private authService: AuthService,
    private carsService: CarsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchDrivers();
    this.fetchDriverUsers();
    this.fetchCars();
  }

  fetchDrivers(): void {
    this.driverService.getAllDrivers().subscribe(
      (drivers) => {
        this.drivers = drivers;
        this.dataSource.data = this.drivers;
        this.applyFilters();
      },
      (error) => {
        console.error('Error fetching drivers:', error);
        this.errorMessage = 'Error fetching driver records.';
      }
    );
  }

  fetchDriverUsers(): void {
    this.userService.getUsersByRoleDriver().subscribe(
      (users) => {
        this.users = users;
        this.users.forEach(user => {
          if (user.id) {
            this.userNames[user.id] = user.username;
          }
        });
      },
      (error) => {
        console.error('Error fetching driver users:', error);
      }
    );
  }

  fetchCars(): void {
    this.carsService.getAllVehicles().subscribe(
      (cars) => {
        this.cars = cars;
        this.cars.forEach(car => {
          if (car.id) {
            this.vehicleDetails[car.id] = {
              licensePlate: car.licensePlate,
              brand: car.brand || 'Unknown',
              model: car.model || 'Unknown'
            };
          }
        });
      },
      (error) => {
        console.error('Error fetching cars:', error);
      }
    );
  }

  getUserName(userId: number): string {
    return this.userNames[userId] || 'Loading...';
  }

  getVehicleDetails(vehicleId?: number): string {
    if (!vehicleId || !this.vehicleDetails[vehicleId]) {
      return 'Not Assigned';
    }
    const vehicle = this.vehicleDetails[vehicleId];
    return `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
  }

  isVehicleAssigned(vehicleId: number): boolean {
    return this.drivers.some(driver => driver.affectedVehicleID === vehicleId);
  }

  addDriver(): void {
    if (this.isProcessing) return;

    if (!this.licenseNumber || !this.phoneNumber || !this.status) {
      this.snackBar.open('Please fill in all required driver fields', 'Close', { duration: 3000 });
      return;
    }

    if (this.status === 'Suspended' && this.affectedVehicleID !== null) {
      this.snackBar.open('Cannot assign a vehicle to a suspended driver', 'Close', { duration: 3000 });
      return;
    }

    if (this.affectedVehicleID && this.isVehicleAssigned(this.affectedVehicleID)) {
      this.snackBar.open('This vehicle is already assigned to another driver', 'Close', { duration: 3000 });
      return;
    }

    this.isProcessing = true;

    if (this.addNewUser) {
      if (!this.newUserUsername || !this.newUserEmail || !this.newUserPassword) {
        this.snackBar.open('Please fill in all required user fields', 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }

      this.authService.register(this.newUserUsername, this.newUserPassword, this.newUserEmail, this.driverRoleId)
        .pipe(
          delay(1000),
          switchMap(() => {
            return this.userService.getAllUsers().pipe(
              map((users: IUser[]) => { // Explicitly type 'users' as IUser[]
                const newUser = users.find((u: IUser) => u.email === this.newUserEmail); // Type 'u' as IUser
                if (newUser && newUser.id) {
                  return newUser;
                }
                throw new Error('User was created but could not be found in the system');
              })
            );
          }),
          switchMap((newUser: IUser) => { // Explicitly type 'newUser' as IUser
            this.users.push(newUser);
            if (newUser.id) {
              this.userNames[newUser.id] = newUser.username;
            }
            const newDriver: IDriver = {
              licenseNumber: this.licenseNumber,
              phoneNumber: this.phoneNumber,
              status: this.status,
              userId: newUser.id!,
              affectedVehicleID: this.affectedVehicleID
            };
            return this.driverService.createDriver(newDriver);
          }),
          finalize(() => {
            this.isProcessing = false;
          })
        )
        .subscribe(
          (driver) => {
            this.drivers.push(driver);
            this.dataSource.data = this.drivers;
            this.showAddForm = false;
            this.applyFilters();
            this.resetForm();
            this.snackBar.open('User and driver added successfully', 'Close', { duration: 3000 });
          },
          (error) => {
            console.error('Error in user/driver creation process:', error);
            this.snackBar.open(error.message || 'Error creating user/driver', 'Close', { duration: 3000 });
            this.fetchDriverUsers();
          }
        );
    } else {
      if (this.userId === null) {
        this.snackBar.open('Please select a user', 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }

      const newDriver: IDriver = {
        licenseNumber: this.licenseNumber,
        phoneNumber: this.phoneNumber,
        status: this.status,
        userId: this.userId,
        affectedVehicleID: this.affectedVehicleID
      };

      this.driverService.createDriver(newDriver)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe(
          (driver) => {
            this.drivers.push(driver);
            this.dataSource.data = this.drivers;
            this.showAddForm = false;
            this.applyFilters();
            this.resetForm();
            this.snackBar.open('Driver added successfully', 'Close', { duration: 3000 });
          },
          (error) => {
            console.error('Error adding driver:', error);
            this.snackBar.open('Error adding driver', 'Close', { duration: 3000 });
          }
        );
    }
  }

  editDriver(driver: IDriver): void {
    this.selectedDriver = driver;
    this.licenseNumber = driver.licenseNumber;
    this.phoneNumber = driver.phoneNumber;
    this.status = driver.status;
    this.userId = driver.userId;
    this.affectedVehicleID = driver.affectedVehicleID || null;
    this.isEditing = true;
    this.showAddForm = true;
    this.addNewUser = false;
  }

  updateDriver(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    if (this.selectedDriver) {
      if (this.status === 'Suspended' && this.affectedVehicleID !== null) {
        this.snackBar.open('Cannot assign a vehicle to a suspended driver', 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }

      if (this.affectedVehicleID && this.isVehicleAssigned(this.affectedVehicleID) &&
          this.selectedDriver.affectedVehicleID !== this.affectedVehicleID) {
        this.snackBar.open('This vehicle is already assigned to another driver', 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }

      const updatedDriver: IDriver = {
        ...this.selectedDriver,
        licenseNumber: this.licenseNumber,
        phoneNumber: this.phoneNumber,
        status: this.status,
        userId: this.userId!,
        affectedVehicleID: this.affectedVehicleID
      };

      this.driverService.updateDriver(updatedDriver.id!, updatedDriver)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe(
          () => {
            const index = this.drivers.findIndex(d => d.id === updatedDriver.id);
            if (index !== -1) {
              this.drivers[index] = updatedDriver;
              this.dataSource.data = this.drivers;
              this.applyFilters();
            }
            this.cancelEdit();
            this.snackBar.open('Driver updated successfully', 'Close', { duration: 3000 });
          },
          (error) => {
            console.error('Error updating driver:', error);
            this.snackBar.open('Error updating driver', 'Close', { duration: 3000 });
          }
        );
    }
  }

  updateDriverStatus(driver: IDriver, newStatus: string): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const updatedDriver: IDriver = {
      ...driver, // Keep existing driver properties
      status: newStatus // Just update the status
    };

    this.driverService.updateDriver(driver.id!, updatedDriver)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe(
        () => {
          const index = this.drivers.findIndex(d => d.id === driver.id);
          if (index !== -1) {
            this.drivers[index] = updatedDriver;
            this.dataSource.data = this.drivers;
            this.applyFilters();
          }
          this.snackBar.open(`Driver status updated to ${newStatus}`, 'Close', { duration: 3000 });
        },
        (error) => {
          console.error('Error updating driver status:', error);
          this.snackBar.open('Error updating driver status', 'Close', { duration: 3000 });
          // Revert status in table in case of error (optional, for better UX)
          const index = this.drivers.findIndex(d => d.id === driver.id);
          if (index !== -1) {
            this.drivers[index].status = driver.status; // Revert to original status
            this.dataSource.data = this.drivers; // Refresh table
          }
        }
      );
  }

  updateVehicleAssignment(driver: IDriver, vehicleId: number | null): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    if (driver.status === 'Suspended' && vehicleId !== null) {
      this.snackBar.open('Cannot assign a vehicle to a suspended driver', 'Close', { duration: 3000 });
      this.isProcessing = false;
      return;
    }

    if (vehicleId && this.isVehicleAssigned(vehicleId) && driver.affectedVehicleID !== vehicleId) {
      this.snackBar.open('This vehicle is already assigned to another driver', 'Close', { duration: 3000 });
      this.isProcessing = false;
      return;
    }

    if (vehicleId === null) {
      this.driverService.removeVehicle(driver.id!)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe(
          (updatedDriver) => {
            const index = this.drivers.findIndex(d => d.id === driver.id);
            if (index !== -1) {
              this.drivers[index] = updatedDriver;
              this.dataSource.data = this.drivers;
              this.applyFilters();
            }
            this.snackBar.open('Vehicle removed successfully', 'Close', { duration: 3000 });
          },
          (error) => {
            console.error('Error removing vehicle:', error);
            this.snackBar.open('Error removing vehicle', 'Close', { duration: 3000 });
          }
        );
    } else {
      this.driverService.assignVehicle(driver.id!, vehicleId)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe(
          (updatedDriver) => {
            const index = this.drivers.findIndex(d => d.id === driver.id);
            if (index !== -1) {
              this.drivers[index] = updatedDriver;
              this.dataSource.data = this.drivers;
              this.applyFilters();
            }
            this.snackBar.open('Vehicle assigned successfully', 'Close', { duration: 3000 });
          },
          (error) => {
            console.error('Error assigning vehicle:', error);
            this.snackBar.open('Error assigning vehicle', 'Close', { duration: 3000 });
          }
        );
    }
  }

  deleteDriver(id: number): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.driverService.deleteDriver(id)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe(
        () => {
          this.drivers = this.drivers.filter(driver => driver.id !== id);
          this.dataSource.data = this.drivers;
          this.applyFilters();
          this.snackBar.open('Driver deleted successfully', 'Close', { duration: 3000 });
        },
        (error) => {
          console.error('Error deleting driver:', error);
          this.snackBar.open('Error deleting driver', 'Close', { duration: 3000 });
        }
      );
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.showAddForm = false;
    this.selectedDriver = null;
    this.resetForm();
  }

  private resetForm(): void {
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

  applyFilters(): void {
    let filteredData = [...this.drivers];

    if (this.filterUsername) {
      filteredData = filteredData.filter(driver =>
        this.getUserName(driver.userId).toLowerCase().includes(this.filterUsername.toLowerCase())
      );
    }

    if (this.filterStatus && this.filterStatus !== 'All') {
      filteredData = filteredData.filter(driver =>
        driver.status.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }

    if (this.filterLicenseNumber) {
      filteredData = filteredData.filter(driver =>
        driver.licenseNumber.toLowerCase().includes(this.filterLicenseNumber.toLowerCase())
      );
    }

    this.dataSource.data = filteredData;
  }

  resetFilters(): void {
    this.filterUsername = '';
    this.filterStatus = '';
    this.filterLicenseNumber = '';
    this.dataSource.data = this.drivers;
  }
  onStatusChange(newStatus: string): void {
    this.status = newStatus;
    console.log('Status changed to:', newStatus);
  }
}