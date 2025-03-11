import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { CarsService } from 'src/app/services/Cars.service';
import { ICars } from 'src/app/interfaces/ICars';
import { DriverService } from 'src/app/services/Driver.service';
import { IDriver } from 'src/app/interfaces/IDriver';
import { AssignmentLogService } from 'src/app/services/AssignmentLog.service';
import { IAssignmentLog } from 'src/app/interfaces/IAssignmentLog';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-assignment-log-admin',
  templateUrl: './assignmentlog.component.html',
  styleUrls: ['./assignmentlog.component.scss'],
  imports: [
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatPaginatorModule
  ],
  standalone: true
})
export class AssignmentlogComponent implements OnInit, AfterViewInit {
  // Data tables
  assignmentLogs: IAssignmentLog[] = [];
  drivers: IDriver[] = [];
  vehicles: ICars[] = [];

  // Filters and selectors
  selectedDriverId: number | null = null;
  selectedVehicleId: number | null = null;
  filterActive = true; // Show only active assignments by default

  // Table configuration
  displayedColumns: string[] = [ 'driverName', 'vehicleName', 'assignedDate', 'unassignedDate', 'status'];
  dataSource = new MatTableDataSource<any>([]);

  // Loading states
  loading = {
    assignments: false,
    drivers: false,
    vehicles: false
  };

  // Error tracking
  errorMessages: { [key: string]: string } = {};

  // Expose Object to template
  public ObjectRef = Object;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private assignmentLogService: AssignmentLogService,
    private driverService: DriverService,
    private carsService: CarsService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Getter for active assignments count
  get activeAssignmentsCount(): number {
    return this.dataSource.data.filter((log: any) => log.status === 'Active').length;
  }

  loadAllData(): void {
    this.loading = { assignments: true, drivers: true, vehicles: true };

    forkJoin({
      drivers: this.driverService.getAllDrivers(),
      vehicles: this.carsService.getAllVehicles()
    }).subscribe({
      next: (data) => {
        this.drivers = data.drivers;
        this.vehicles = data.vehicles;
        this.loading.drivers = false;
        this.loading.vehicles = false;

        // Load all assignments initially
        this.loadAllAssignments();
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.errorMessages['data'] = 'Failed to load drivers or vehicles.';
        this.loading.drivers = false;
        this.loading.vehicles = false;
      }
    });
  }

  loadAllAssignments(): void {
    this.loading.assignments = true;
    this.selectedDriverId = null;
    this.selectedVehicleId = null;

    this.assignmentLogService.getAllAssignmentHistory().subscribe({
      next: (logs) => {
        this.assignmentLogs = logs;
        this.updateDataSource();
        this.loading.assignments = false;
      },
      error: (err) => {
        console.error('Error loading all assignment logs:', err);
        this.errorMessages['assignments'] = 'Failed to load assignment history.';
        this.loading.assignments = false;
      }
    });
  }

  loadAssignmentsForDriver(driverId: number): void {
    this.loading.assignments = true;
    this.selectedDriverId = driverId;
    this.selectedVehicleId = null;

    this.assignmentLogService.getAssignmentHistoryByDriver(driverId).subscribe({
      next: (logs) => {
        this.assignmentLogs = logs;
        this.updateDataSource();
        this.loading.assignments = false;
      },
      error: (err) => {
        console.error('Error loading assignment logs for driver:', err);
        this.errorMessages['assignments'] = 'Failed to load assignment history.';
        this.loading.assignments = false;
      }
    });
  }

  loadAssignmentsForVehicle(vehicleId: number): void {
    this.loading.assignments = true;
    this.selectedVehicleId = vehicleId;
    this.selectedDriverId = null;

    this.assignmentLogService.getAssignmentHistoryByVehicle(vehicleId).subscribe({
      next: (logs) => {
        this.assignmentLogs = logs;
        this.updateDataSource();
        this.loading.assignments = false;
      },
      error: (err) => {
        console.error('Error loading assignment logs for vehicle:', err);
        this.errorMessages['assignments'] = 'Failed to load assignment history.';
        this.loading.assignments = false;
      }
    });
  }

  updateDataSource(): void {
    const processedLogs = this.assignmentLogs.map(log => {
      const driver = this.drivers.find(d => d.id === log.driverId);
      const vehicle = this.vehicles.find(v => v.id === log.vehicleId);
      const isActive = !log.unassignedDate;

      return {
        ...log,
        driverName: driver ? `${driver.licenseNumber} ${driver.phoneNumber}` : 'Unknown Driver',
        vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown Vehicle',
        status: isActive ? 'Active' : 'Completed'
      };
    });

    const filteredLogs = this.filterActive
      ? processedLogs.filter(log => !log.unassignedDate)
      : processedLogs;

    this.dataSource.data = filteredLogs;
  }

  toggleFilter(): void {
    this.filterActive = !this.filterActive;
    this.updateDataSource();
  }

  clearFilter(): void {
    this.selectedDriverId = null;
    this.selectedVehicleId = null;
    this.loadAllAssignments();
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}