import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IDriver } from 'src/app/interfaces/IDriver';
import { DriverService } from 'src/app/services/Driver.service';
import { UserService } from 'src/app/services/UserService.service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { CarsService } from 'src/app/services/Cars.service';
import { ICars } from 'src/app/interfaces/ICars';

@Component({
  selector: 'app-driver',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
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
    MatInputModule,
    MatDatepickerModule,
    MatMenuModule,
    MatNativeDateModule
  ]
})
export class DriversComponent implements OnInit {
  drivers: IDriver[] = [];
  users: any[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';
  showAddForm: boolean = false;
  isEditing: boolean = false;
  selectedDriver: IDriver | null = null;

  // Form fields
  licenseNumber: string = '';
  phoneNumber: string = '';
  status: string = '';
  userId: number | null = null;
  affectedVehicleID: number | null = null;

  displayedColumns: string[] = ['id', 'licenseNumber', 'phoneNumber', 'status', 'user', 'vehicle', 'actions'];
  dataSource = new MatTableDataSource<IDriver>(this.drivers);

  userNames: { [key: number]: string } = {};
  vehicleDetails: { [key: number]: { licensePlate: string, brand: string, model: string } } = {}; // Enhanced vehicle details

  constructor(
    private driverService: DriverService,
    private userService: UserService,
    private carsService: CarsService
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
        console.log('Fetched drivers:', this.drivers);
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
          this.userNames[user.id] = user.username; // Cache usernames
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
          // Store complete vehicle details
          this.vehicleDetails[car.id!] = {
            licensePlate: car.licensePlate,
            brand: car.brand || 'Unknown',
            model: car.model || 'Unknown'
          };
        });
      },
      (error) => { console.error('Error fetching cars:', error); }
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

  addDriver(): void {
    if (this.licenseNumber && this.phoneNumber && this.status && this.userId !== null && this.affectedVehicleID !== null) {
      const newDriver: IDriver = {
        licenseNumber: this.licenseNumber,
        phoneNumber: this.phoneNumber,
        status: this.status,
        userId: this.userId,
        affectedVehicleID: this.affectedVehicleID
      };

      this.driverService.createDriver(newDriver).subscribe(
        (driver) => {
          this.drivers.push(driver);
          this.dataSource.data = this.drivers;
          this.showAddForm = false;
        },
        (error) => {
          console.error('Error adding driver:', error);
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
    this.affectedVehicleID = driver.affectedVehicleID;
    this.isEditing = true;
    this.showAddForm = true;
  }

  updateDriver(): void {
    if (this.selectedDriver) {
      const updatedDriver: IDriver = {
        ...this.selectedDriver,
        licenseNumber: this.licenseNumber,
        phoneNumber: this.phoneNumber,
        status: this.status,
        userId: this.userId!,
        affectedVehicleID: this.affectedVehicleID!
      };
  
      this.driverService.updateDriver(updatedDriver.id!, updatedDriver).subscribe(
        () => {
          const index = this.drivers.findIndex(d => d.id === updatedDriver.id);
          if (index !== -1) {
            this.drivers[index] = updatedDriver;
            this.dataSource.data = this.drivers;
          }
          this.cancelEdit();
        },
        (error) => {
          console.error('Error updating driver:', error);
        }
      );
    }
  }

  deleteDriver(id: number): void {
    this.driverService.deleteDriver(id).subscribe(
      () => {
        this.drivers = this.drivers.filter(driver => driver.id !== id);
        this.dataSource.data = this.drivers;
      },
      (error) => {
        console.error('Error deleting driver:', error);
      }
    );
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.showAddForm = false;
    this.selectedDriver = null;
    this.licenseNumber = '';
    this.phoneNumber = '';
    this.status = '';
    this.userId = null;
    this.affectedVehicleID = null;
  }
}