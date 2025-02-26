import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { IMission } from 'src/app/interfaces/IMission';
import { ICars } from 'src/app/interfaces/ICars';
import { IDriver } from 'src/app/interfaces/IDriver';
import { MissionsService } from 'src/app/services/Mission.Service';
import { CarsService } from 'src/app/services/Cars.service';
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
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { DriverDetailsDialogComponent } from '../missions/driver-details-dialog.component';
import { CarDetailsDialogComponent } from '../missions/car-details-dialog.component';

@Component({
  selector: 'app-missions',
  templateUrl: './missions.component.html',
  styleUrls: ['./missions.component.scss'],
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
export class MissionsComponent implements OnInit {
  missions: IMission[] = [];
  vehicles: ICars[] = [];
  drivers: IDriver[] = [];
  errorMessage: string = '';

  showAddForm: boolean = false;
  isEditing: boolean = false;
  selectedMission: IMission | null = null;

  // Form fields for mission CRUD
  destination: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  distance: number | null = null;
  status: string = '';
  vehicleID: number | null = null;
  driverID: number | null = null;

  displayedColumns: string[] = [ 'destination', 'startDate', 'endDate', 'distance',
    'status', 'vehicle', 'driver', 'actions'
  ];
  dataSource = new MatTableDataSource<IMission>(this.missions);

  // Caches for quick lookup of extra details
  vehicleModels: { [key: number]: string } = {};
  driverNames: { [key: number]: string } = {};

  constructor(
    private missionsService: MissionsService,
    private carsService: CarsService,
    private driverService: DriverService,
    private userService: UserService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchMissions();
    this.fetchVehicles();
    this.fetchDrivers();
  }

  fetchMissions(): void {
    this.missionsService.getAllMissions().subscribe(
      missions => {
        this.missions = missions;
        this.dataSource.data = this.missions;
      },
      error => {
        console.error('Error fetching missions:', error);
        this.errorMessage = 'Error fetching missions.';
      }
    );
  }

  fetchVehicles(): void {
    this.carsService.getAllVehicles().subscribe(
      vehicles => {
        this.vehicles = vehicles;
        vehicles.forEach(vehicle => {
          if (vehicle.id) {
            this.vehicleModels[vehicle.id] = vehicle.model;
          }
        });
      },
      error => {
        console.error('Error fetching vehicles:', error);
      }
    );
  }

  fetchDrivers(): void {
    this.driverService.getAllDrivers().subscribe(
      drivers => {
        this.drivers = drivers;
        drivers.forEach(driver => {
          if (driver.id && driver.userId) {
            this.getDriverName(driver.id, driver.userId);
          }
        });
      },
      error => {
        console.error('Error fetching drivers:', error);
      }
    );
  }

  // Fetch and cache the driver's username based on driver.userId.
  getDriverName(driverId: number, userId: number): string {
    if (this.driverNames[driverId]) {
      return this.driverNames[driverId];
    }
    this.userService.getUserById(userId).subscribe(
      user => {
        this.driverNames[driverId] = user.username;
      },
      error => {
        console.error('Error fetching driver user:', error);
        this.driverNames[driverId] = 'Unknown';
      }
    );
    return 'Loading...';
  }

  // Helper to get vehicle model from cache.
  getVehicleModel(vehicleID: number): string {
    return this.vehicleModels[vehicleID] || 'Unknown';
  }

  // Helper for table: given a mission's driverID, look up the driver's name.
  getDriverNameFromMission(driverID: number): string {
    const driver = this.drivers.find(d => d.id === driverID);
    if (driver && driver.userId) {
      return this.getDriverName(driver.id!, driver.userId);
    }
    return 'Unknown';
  }

  // CRUD Operations for Missions
  addMission(): void {
    if (this.destination && this.startDate && this.endDate && this.distance !== null &&
        this.status && this.vehicleID && this.driverID) {
      const newMission: IMission = {
        destination: this.destination,
        startDate: this.startDate,
        endDate: this.endDate,
        distance: this.distance,
        status: this.status,
        vehicleID: this.vehicleID,
        driverID: this.driverID
      };
      this.missionsService.createMission(newMission).subscribe(
        mission => {
          this.missions.push(mission);
          this.dataSource.data = this.missions;
          this.resetForm();
        },
        error => {
          console.error('Error adding mission:', error);
        }
      );
    }
  }

  editMission(mission: IMission): void {
    this.selectedMission = mission;
    this.destination = mission.destination;
    this.startDate = new Date(mission.startDate);
    this.endDate = new Date(mission.endDate);
    this.distance = mission.distance;
    this.status = mission.status;
    this.vehicleID = mission.vehicleID;
    this.driverID = mission.driverID;
    this.isEditing = true;
    this.showAddForm = true;
  }

  updateMission(): void {
    if (this.selectedMission && this.destination && this.startDate && this.endDate &&
        this.distance !== null && this.status && this.vehicleID && this.driverID) {
      const updatedMission: IMission = {
        ...this.selectedMission,
        destination: this.destination,
        startDate: this.startDate,
        endDate: this.endDate,
        distance: this.distance,
        status: this.status,
        vehicleID: this.vehicleID,
        driverID: this.driverID
      };
      this.missionsService.updateMission(updatedMission.id!, updatedMission).subscribe(
        () => {
          const index = this.missions.findIndex(m => m.id === updatedMission.id);
          if (index !== -1) {
            this.missions[index] = updatedMission;
            this.dataSource.data = this.missions;
          }
          this.resetForm();
        },
        error => {
          console.error('Error updating mission:', error);
        }
      );
    }
  }

  deleteMission(id: number): void {
    this.missionsService.deleteMission(id).subscribe(
      () => {
        this.missions = this.missions.filter(m => m.id !== id);
        this.dataSource.data = this.missions;
      },
      error => {
        console.error('Error deleting mission:', error);
      }
    );
  }

  resetForm(): void {
    this.destination = '';
    this.startDate = null;
    this.endDate = null;
    this.distance = null;
    this.status = '';
    this.vehicleID = null;
    this.driverID = null;
    this.isEditing = false;
    this.showAddForm = false;
    this.selectedMission = null;
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  // Open dialogs for additional details

  openDriverDetails(mission: IMission): void {
    const driver = this.drivers.find(d => d.id === mission.driverID);
    if (driver) {
      this.dialog.open(DriverDetailsDialogComponent, {
        width: '400px',
        data: driver
      });
    }
  }

  openCarDetails(mission: IMission): void {
    const vehicle = this.vehicles.find(v => v.id === mission.vehicleID);
    if (vehicle) {
      this.dialog.open(CarDetailsDialogComponent, {
        width: '400px',
        data: vehicle
      });
    }
  }
}