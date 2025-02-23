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
  errorMessage: string = '';

  showAddForm: boolean = false;
  isEditing: boolean = false;
  selectedDriver: IDriver | null = null;

  // Form fields
  licenseNumber: string = '';
  phoneNumber: string = '';
  status: string = '';
  userId: number | null = null;

  displayedColumns: string[] = ['id', 'licenseNumber', 'phoneNumber', 'status', 'user', 'actions'];
  dataSource = new MatTableDataSource<IDriver>(this.drivers);

  // Cache for storing usernames by userId
  userNames: { [key: number]: string } = {};

  constructor(
    private driverService: DriverService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.fetchDrivers();
    this.fetchDriverUsers();
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
        console.log('Fetched driver users:', users);
      },
      (error) => {
        console.error('Error fetching driver users:', error);
      }
    );
  }

  // Using the correct property "userId"
  getUserName(userId: number): string {
    if (this.userNames[userId]) {
      return this.userNames[userId];
    }
    
    this.userService.getUserById(userId).subscribe(
      (user) => {
        console.log('Fetched user:', user);
        this.userNames[userId] = user.username;
      },
      error => {
        console.error('Error fetching user:', error);
        this.userNames[userId] = 'Error';
      }
    );
    
    return 'Loading...';
  }

  addDriver(): void {
    if (this.licenseNumber && this.phoneNumber && this.status && this.userId !== null) {
      const newDriver: IDriver = {
        licenseNumber: this.licenseNumber,
        phoneNumber: this.phoneNumber,
        status: this.status,
        userId: this.userId
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
        userId: this.userId!
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
  }
}
