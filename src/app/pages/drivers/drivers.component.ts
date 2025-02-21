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
  // Users with driver role fetched from UserService.getUsersByRoleDriver()
  users: any[] = [];
  errorMessage: string = '';

  showAddForm: boolean = false;
  isEditing: boolean = false;
  selectedDriver: IDriver | null = null;

  // Form fields
  licenseNumber: string = '';
  phoneNumber: string = '';
  status: string = '';
  userID: number | null = null;

  displayedColumns: string[] = ['id', 'licenseNumber', 'phoneNumber', 'status', 'user', 'actions'];
  dataSource = new MatTableDataSource<IDriver>(this.drivers);

  // Cache to store fetched usernames by userID
  userNameCache: { [key: number]: string } = {};

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
        console.log('Fetched drivers:', drivers);
      },
      (error) => {
        console.error('Error fetching drivers:', error);
        this.errorMessage = 'Error fetching driver records.';
      }
    );
  }

  // Get users with role "Driver" using your UserService function
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

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedDriver = null;
    this.licenseNumber = '';
    this.phoneNumber = '';
    this.status = '';
    this.userID = null;
  }

  addDriver(): void {
    if (!this.licenseNumber.trim() || !this.phoneNumber.trim() || !this.status.trim() || !this.userID) {
      alert('Please fill in all required fields.');
      return;
    }
    const newDriver: IDriver = {
      licenseNumber: this.licenseNumber,
      phoneNumber: this.phoneNumber,
      status: this.status,
      userID: this.userID
    };
    this.driverService.createDriver(newDriver).subscribe(
      (driver) => {
        this.drivers.push(driver);
        this.dataSource.data = this.drivers;
        this.resetForm();
        this.showAddForm = false;
        alert('Driver added successfully!');
      },
      (error) => {
        console.error('Error adding driver:', error);
        alert('Failed to add driver.');
      }
    );
  }

  startEdit(driver: IDriver): void {
    this.selectedDriver = { ...driver };
    this.isEditing = true;
    this.showAddForm = true;
    this.licenseNumber = driver.licenseNumber;
    this.phoneNumber = driver.phoneNumber;
    this.status = driver.status;
    this.userID = driver.userID;
  }

  saveEditedDriver(): void {
    if (!this.selectedDriver) return;
    if (!this.licenseNumber.trim() || !this.phoneNumber.trim() || !this.status.trim() || !this.userID) {
      alert('Please fill in all required fields.');
      return;
    }
    const updatedDriver: IDriver = {
      ...this.selectedDriver,
      licenseNumber: this.licenseNumber,
      phoneNumber: this.phoneNumber,
      status: this.status,
      userID: this.userID
    };
    this.driverService.updateDriver(this.selectedDriver.id!, updatedDriver).subscribe(
      () => {
        const index = this.drivers.findIndex(d => d.id === this.selectedDriver!.id);
        if (index !== -1) {
          this.drivers[index] = updatedDriver;
          this.dataSource.data = this.drivers;
        }
        this.cancelEdit();
        alert('Driver updated successfully!');
      },
      (error) => {
        console.error('Error updating driver:', error);
        alert('Failed to update driver.');
      }
    );
  }

  cancelEdit(): void {
    this.resetForm();
    this.showAddForm = false;
  }

  deleteDriver(id: number): void {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    this.driverService.deleteDriver(id).subscribe(
      () => {
        this.drivers = this.drivers.filter(d => d.id !== id);
        this.dataSource.data = this.drivers;
        alert('Driver deleted successfully!');
      },
      (error) => {
        console.error('Error deleting driver:', error);
        alert('Failed to delete driver.');
      }
    );
  }

  // Instead of using local users array, fetch username via getUserById with caching.
  getUserName(userID: number): string {
    if (this.userNameCache[userID]) {
      return this.userNameCache[userID];
    } else {
      this.userService.getUserById(userID).subscribe(user => {
        this.userNameCache[userID] = user.username;
      });
      return 'Loading...';
    }
  }
}
