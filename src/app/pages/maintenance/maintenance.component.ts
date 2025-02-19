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
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableDataSource } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
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
export class MaintenanceComponent implements OnInit {
  maintenances: IMaintenance[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';

  showAddForm: boolean = false;
  isEditing: boolean = false;

  maintenanceType: string = '';
  maintenanceCost: number = 0;
  maintenanceDate: Date | null = null;
  maintenanceNotes: string = '';
  maintenanceVehicleID: number | null = null;

  selectedMaintenance: IMaintenance | null = null;

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
        console.log('Fetched maintenances:', records);
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
        console.log('Fetched cars:', cars);
      },
      (error) => {
        console.error('Error fetching cars:', error);
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
    this.selectedMaintenance = null;
    this.maintenanceType = '';
    this.maintenanceCost = 0;
    this.maintenanceDate = null;
    this.maintenanceNotes = '';
    this.maintenanceVehicleID = null;
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
    console.log('Maintenance added:', newRecord);
    this.maintenancesService.createMaintenance(newRecord).subscribe(
      (record) => {
        this.maintenances.push(record);
        this.dataSource.data = this.maintenances;
        this.resetForm();
        this.showAddForm = false;
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
    if (!this.maintenanceType.trim() || !this.maintenanceDate || !this.maintenanceVehicleID) {
      alert('Please fill in the required fields.');
      return;
    }

    if (!this.selectedMaintenance) return;

    const updatedRecord: IMaintenance = {
      ...this.selectedMaintenance,
      type: this.maintenanceType,
      cost: this.maintenanceCost,
      maintenanceDate: this.formatDate(this.maintenanceDate),
      notes: this.maintenanceNotes,
      vehicleID: this.maintenanceVehicleID
    };
    console.log('Maintenance updated:', updatedRecord);
    this.maintenancesService.updateMaintenance(this.selectedMaintenance.id!, updatedRecord).subscribe(
      () => {
        const index = this.maintenances.findIndex(m => m.id === this.selectedMaintenance?.id);
        if (index !== -1) {
          this.maintenances[index] = updatedRecord;
          this.dataSource.data = this.maintenances;
        }
        this.cancelEdit();
        alert('Maintenance record updated successfully!');
      },
      (error) => {
        console.error('Error updating maintenance:', error);
        alert('Failed to update maintenance record.');
      }
    );
  }

  cancelEdit(): void {
    this.resetForm();
    this.showAddForm = false;
  }

  deleteMaintenance(id: number): void {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    this.maintenancesService.deleteMaintenance(id).subscribe(
      () => {
        this.maintenances = this.maintenances.filter(m => m.id !== id);
        this.dataSource.data = this.maintenances;
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
    return car ? car.model : 'N/A';
  }
}