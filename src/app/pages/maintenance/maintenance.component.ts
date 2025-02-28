// maintenance.component.ts
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

  showAddForm: boolean = false;
  isEditing: boolean = false;

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

  displayedColumns: string[] = ['type', 'cost', 'maintenanceDate', 'notes', 'vehicle', 'actions'];
  dataSource = new MatTableDataSource<IMaintenance>(this.maintenances);

  constructor(
    private maintenancesService: MaintenancesService,
    private carsService: CarsService
  ) {}

  ngOnInit(): void {
    this.fetchMaintenances();
    this.fetchCars();
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
    this.selectedMaintenance = null;
    this.maintenanceType = '';
    this.maintenanceCost = 0;
    this.maintenanceDate = null;
    this.maintenanceNotes = '';
    this.maintenanceVehicleID = null;
    this.showAddForm = false;
  }

  addMaintenance(): void {
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID) {
      alert('Please fill in the required fields.');
      return;
    }

    const newRecord: IMaintenance = {
      type: this.maintenanceType,
      cost: this.maintenanceCost,
      maintenanceDate: this.formatDate(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID
    };

    this.maintenancesService.createMaintenance(newRecord).subscribe(
      (record) => {
        this.maintenances.push(record);
        this.dataSource.data = this.maintenances;
        this.resetForm();
        this.applyFilters();
        alert('Maintenance record added successfully!');
      },
      (error) => {
        console.error('Error adding maintenance:', error);
        alert('Failed to add maintenance record.');
      }
    );
  }

  startEdit(record: IMaintenance): void {
    this.selectedMaintenance = { ...record };
    this.isEditing = true;
    this.showAddForm = true;

    this.maintenanceType = record.type;
    this.maintenanceCost = record.cost;
    this.maintenanceDate = new Date(record.maintenanceDate);
    this.maintenanceNotes = record.notes;
    this.maintenanceVehicleID = record.vehicleID;
  }

  saveEditedMaintenance(): void {
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
      },
      (error) => {
        console.error('Error updating maintenance:', error);
        alert('Failed to update maintenance record.');
      }
    );
  }

  deleteMaintenance(id: number): void {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    this.maintenancesService.deleteMaintenance(id).subscribe(
      () => {
        this.maintenances = this.maintenances.filter(m => m.id !== id);
        this.dataSource.data = this.maintenances;
        this.applyFilters();
        alert('Maintenance record deleted successfully!');
      },
      (error) => {
        console.error('Error deleting maintenance:', error);
        alert('Failed to delete maintenance record.');
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
    this.dataSource.data = this.maintenances;
  }

  toggleCostSort(): void {
    this.sortCostAsc = !this.sortCostAsc;
    this.applyFilters();
  }
}