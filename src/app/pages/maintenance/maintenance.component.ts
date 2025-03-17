import { Component, OnInit } from '@angular/core';
import { IMaintenance } from '../../interfaces/IMaintenance';
import { MaintenancesService } from '../../services/Maintenance.Service';
import { CarsService } from '../../services/Cars.service';
import { ICars } from '../../interfaces/ICars';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableDataSource } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { AuthService } from 'src/app/services/AuthService.Service';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
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
    MatDatepickerModule,
    MatMenuModule,
    MatNativeDateModule,
    MatTooltip
  ]
})
export class MaintenanceComponent implements OnInit {
  maintenances: IMaintenance[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';
  userRole: string | null = null; // User Role
  userId: number | null = null; // User ID

  showAddForm: boolean = false;
  isEditing: boolean = false;
  isRequestingMaintenance: boolean = false; // Flag for driver maintenance request form
  showPendingRequests: boolean = false; // Flag to show pending requests table
  pendingRequests: IMaintenance[] = []; // Array to hold pending requests

  filtersExpanded: boolean = false; // Added to control filter visibility

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
  filterNotes: string = '';
  sortCostAsc: boolean = true;
  filterStatus: string = ''; // Filter by Status

  displayedColumns: string[] = ['type', 'cost', 'maintenanceDate', 'notes', 'vehicle', 'status', 'actions']; // Added status column
  pendingDisplayedColumns: string[] = ['type', 'maintenanceDate', 'vehicle', 'driver', 'notes', 'actions']; // Columns for pending requests
  dataSource = new MatTableDataSource<IMaintenance>(this.maintenances);
  pendingDataSource = new MatTableDataSource<IMaintenance>(this.pendingRequests); // Data source for pending requests

  constructor(
    private maintenancesService: MaintenancesService,
    private carsService: CarsService,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit(): void {
    this.loadRoleAndFetchData(); // Call loadRoleAndFetchData on init
    this.fetchCars();
  }

  loadRoleAndFetchData(): void {
    this.authService.loadUserProfile().subscribe(role => { // Use loadUserProfile to get role
      this.userRole = role; // Set user role
      const userIdString = this.authService.getUserId();
      this.userId = userIdString ? parseInt(userIdString, 10) : null; // Get User ID

      this.fetchMaintenancesBasedOnRole(); // Fetch data based on role AFTER role is loaded
    }, error => {
      console.error('Error loading user profile:', error);
      this.errorMessage = 'Error loading user profile.';
      this.fetchMaintenances(); // Fallback to fetching all maintenances if profile load fails (or handle as needed)
    });
  }

  fetchMaintenancesBasedOnRole(): void {
    if (this.userRole === 'ADMIN' || this.userRole === 'MANAGER') {
      this.fetchMaintenances(); // Fetch all maintenances for ADMIN/MANAGER
    } else if (this.userRole === 'DRIVER') {
      if (this.userId !== null) {
        this.fetchMaintenancesForDriver(this.userId); // Fetch only driver's maintenances
      } else {
        console.error('Driver ID not available.');
        this.errorMessage = 'Driver ID not available.';
      }
    } else {
      this.fetchMaintenances(); // Default fetch all if role is unknown
    }
  }


  fetchMaintenances(): void {
    this.maintenancesService.getAllMaintenances().subscribe(
      (records) => {
        this.maintenances = records;
        this.dataSource.data = this.maintenances;
        this.applyFilters();
      },
      (error) => {
        console.error('Error fetching maintenances:', error);
        this.errorMessage = 'Error fetching maintenance records.';
      }
    );
  }

  fetchMaintenancesForDriver(driverId: number): void {
    this.maintenancesService.getMaintenancesByDriverId(driverId).subscribe(
      (records) => {
        this.maintenances = records;
        this.dataSource.data = this.maintenances;
        this.applyFilters();
      },
      (error) => {
        console.error('Error fetching driver maintenances:', error);
        this.errorMessage = 'Error fetching maintenance records for driver.';
      }
    );
  }

  fetchPendingRequests(): void {
    this.maintenancesService.getAllPendingMaintenances().subscribe(
      (requests) => {
        this.pendingRequests = requests;
        this.pendingDataSource.data = this.pendingRequests;
        this.showPendingRequests = true; // Show pending requests table
      },
      (error) => {
        console.error('Error fetching pending maintenance requests:', error);
        this.errorMessage = 'Error fetching pending maintenance requests.';
      }
    );
  }

  fetchCars(): void {
    this.carsService.getAllVehicles().subscribe(
      (cars) => {
        this.cars = cars;
      },
      (error) => {
        console.error('Error fetching cars:', error);
      }
    );
  }

  resetForm(): void {
    this.isEditing = false;
    this.isRequestingMaintenance = false; // Reset request maintenance form flag
    this.selectedMaintenance = null;
    this.maintenanceType = '';
    this.maintenanceCost = 0;
    this.maintenanceDate = null;
    this.maintenanceNotes = '';
    this.maintenanceVehicleID = null;
    this.showAddForm = false;
  }

  addMaintenance(): void { // ADMIN/MANAGER Add Maintenance
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID) {
      alert('Please fill in the required fields.');
      return;
    }

    const newRecord: IMaintenance = {
      type: this.maintenanceType,
      cost: this.maintenanceCost,
      maintenanceDate: this.formatDate(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID,
      status: 'Accepted' // Default status when ADMIN/MANAGER adds maintenance
    };

    this.maintenancesService.createMaintenanceRequest(newRecord,0).subscribe( // Use createMaintenance for ADMIN/MANAGER
      (record) => {
        this.maintenances.push(record);
        this.dataSource.data = this.maintenances;
        this.resetForm();
        this.applyFilters();
        alert('Maintenance record added successfully!');
        this.fetchMaintenancesBasedOnRole(); // Refresh data based on role
      },
      (error) => {
        console.error('Error adding maintenance:', error);
        alert('Failed to add maintenance record.');
      }
    );
  }

  requestMaintenance(): void { // DRIVER Request Maintenance
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID || !this.userId) {
      alert('Please fill in the required fields.');
      return;
    }

    const newRequest: IMaintenance = {
      type: this.maintenanceType,
      maintenanceDate: this.formatDate(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID,
      cost: this.maintenanceCost // Cost might be 0 or estimated by driver
    };

    this.maintenancesService.createMaintenanceRequest(newRequest, this.userId).subscribe( // Use createMaintenanceRequest for DRIVER
      (record) => {
        this.maintenances.push(record);
        this.dataSource.data = this.maintenances;
        this.resetForm();
        this.applyFilters();
        alert('Maintenance request submitted successfully!');
        this.fetchMaintenancesBasedOnRole(); // Refresh data based on role
      },
      (error) => {
        console.error('Error requesting maintenance:', error);
        alert('Failed to submit maintenance request.');
      }
    );
  }

  startEdit(record: IMaintenance): void {
    this.selectedMaintenance = { ...record };
    this.isEditing = true;
    this.showAddForm = true;
    this.isRequestingMaintenance = false; // Ensure request form is hidden

    this.maintenanceType = record.type;
    this.maintenanceCost = record.cost;
    this.maintenanceDate = new Date(record.maintenanceDate);
    this.maintenanceNotes = record.notes;
    this.maintenanceVehicleID = record.vehicleID;
  }

  startRequestMaintenance(): void { // Open Request Maintenance Form for DRIVER
    this.resetForm(); // Reset form before showing
    this.showAddForm = true;
    this.isRequestingMaintenance = true;
    this.isEditing = false;
  }


  saveEditedMaintenance(): void { // ADMIN/MANAGER Save Edited Maintenance
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID || !this.selectedMaintenance) {
      alert('Please fill in the required fields.');
      return;
    }

    const updatedRecord: IMaintenance = {
      ...this.selectedMaintenance,
      type: this.maintenanceType,
      cost: this.maintenanceCost,
      maintenanceDate: this.formatDate(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID
    };

    this.maintenancesService.updateMaintenance(this.selectedMaintenance.id!, updatedRecord).subscribe(
      () => {
        const index = this.maintenances.findIndex(m => m.id === this.selectedMaintenance?.id);
        if (index !== -1) {
          this.maintenances[index] = updatedRecord;
          this.dataSource.data = this.maintenances;
          this.applyFilters();
        }
        this.resetForm();
        alert('Maintenance record updated successfully!');
        this.fetchMaintenancesBasedOnRole(); // Refresh data based on role
      },
      (error) => {
        console.error('Error updating maintenance:', error);
        alert('Failed to update maintenance record.');
      }
    );
  }

  deleteMaintenance(id: number): void { // ADMIN/MANAGER Delete Maintenance
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    this.maintenancesService.deleteMaintenance(id).subscribe(
      () => {
        this.maintenances = this.maintenances.filter(m => m.id !== id);
        this.dataSource.data = this.maintenances;
        this.applyFilters();
        alert('Maintenance record deleted successfully!');
        this.fetchMaintenancesBasedOnRole(); // Refresh data based on role
      },
      (error) => {
        console.error('Error deleting maintenance:', error);
        alert('Failed to delete maintenance record.');
      }
    );
  }

  acceptMaintenanceRequest(maintenanceId: number): void { // ADMIN/MANAGER Accept Request
    if (!confirm('Are you sure you want to accept this maintenance request?')) return;
    this.maintenancesService.acceptMaintenance(maintenanceId).subscribe(
      () => {
        alert('Maintenance request accepted successfully!');
        this.showPendingRequests = false; // Hide pending table after action
        this.fetchPendingRequests(); // Refresh pending requests table
        this.fetchMaintenancesBasedOnRole(); // Refresh main maintenance table
      },
      (error) => {
        console.error('Error accepting maintenance request:', error);
        alert('Failed to accept maintenance request.');
      }
    );
  }

  rejectMaintenanceRequest(maintenanceId: number): void { // ADMIN/MANAGER Reject Request
    if (!confirm('Are you sure you want to reject this maintenance request?')) return;
    this.maintenancesService.rejectMaintenance(maintenanceId).subscribe(
      () => {
        alert('Maintenance request rejected successfully!');
        this.showPendingRequests = false; // Hide pending table after action
        this.fetchPendingRequests(); // Refresh pending requests table
        this.fetchMaintenancesBasedOnRole(); // Refresh main maintenance table
      },
      (error) => {
        console.error('Error rejecting maintenance request:', error);
        alert('Failed to reject maintenance request.');
      }
    );
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getVehicleModel(vehicleID: number): string {
    const car = this.cars.find(c => c.id === vehicleID);
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'N/A';
  }

  getDriverName(driverId: number | undefined): string {
    // In a real application, you would fetch driver names based on IDs.
    // For now, return a placeholder or fetch from available driver data if you have it.
    return driverId ? `Driver ID ${driverId}` : 'N/A';
  }


  applyFilters(): void {
    let filteredData = [...this.maintenances];

    // Filter by type
    if (this.filterType) {
      filteredData = filteredData.filter(record =>
        record.type.toLowerCase().includes(this.filterType.toLowerCase())
      );
    }

    // Filter by cost range
    if (this.filterMinCost !== null) {
      filteredData = filteredData.filter(record => record.cost >= this.filterMinCost!);
    }
    if (this.filterMaxCost !== null) {
      filteredData = filteredData.filter(record => record.cost <= this.filterMaxCost!);
    }

    // Filter by date range
    if (this.filterStartDate) {
      filteredData = filteredData.filter(record =>
        new Date(record.maintenanceDate) >= this.filterStartDate!
      );
    }
    if (this.filterEndDate) {
      filteredData = filteredData.filter(record =>
        new Date(record.maintenanceDate) <= this.filterEndDate!
      );
    }

    // Filter by vehicle
    if (this.filterVehicle) {
      filteredData = filteredData.filter(record =>
        this.getVehicleModel(record.vehicleID).toLowerCase()
          .includes(this.filterVehicle.toLowerCase())
      );
    }

    // Filter by notes
    if (this.filterNotes) {
      filteredData = filteredData.filter(record =>
        record.notes?.toLowerCase().includes(this.filterNotes.toLowerCase())
      );
    }

    // Filter by status
    if (this.filterStatus) {
      filteredData = filteredData.filter(record =>
        record.status?.toLowerCase().includes(this.filterStatus.toLowerCase())
      );
    }

    // Sort by cost
    filteredData.sort((a, b) =>
      this.sortCostAsc ? a.cost - b.cost : b.cost - a.cost
    );

    this.dataSource.data = filteredData;
  }

  resetFilters(): void {
    this.filterType = '';
    this.filterMinCost = null;
    this.filterMaxCost = null;
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterVehicle = '';
    this.filterNotes = '';
    this.filterStatus = ''; // Reset status filter
    this.dataSource.data = this.maintenances;
  }

  toggleCostSort(): void {
    this.sortCostAsc = !this.sortCostAsc;
    this.applyFilters();
  }

  togglePendingRequestsTable(): void {
    this.showPendingRequests = !this.showPendingRequests;
    if (this.showPendingRequests && this.pendingRequests.length === 0) {
      this.fetchPendingRequests(); // Fetch pending requests only when table is toggled to show
    }
  }

  toggleFilters(): void { // New method to toggle filter visibility
    this.filtersExpanded = !this.filtersExpanded;
  }
}