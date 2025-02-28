// tires.component.ts
import { Component, OnInit } from '@angular/core';
import { TiresService } from '../../services/Tires.Service';
import { ITire } from '../../interfaces/ITire';
import { CarsService } from '../../services/Cars.service';
import { ICars } from '../../interfaces/ICars';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-tires',
  templateUrl: './tires.component.html',
  styleUrls: ['./tires.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    CommonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule
  ],
})
export class TiresComponent implements OnInit {
  cars: ICars[] = [];
  tires: ITire[] = [];
  displayedColumns: string[] = ['brand', 'model', 'installationDate', 'mileageAtInstallation', 'vehicle', 'actions'];

  // Form data
  tireForm: ITire = this.initTireForm();
  isEditing = false;
  showForm = false;

  // Filter properties
  filterBrand = '';
  filterModel = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  filterMinMileage: number | null = null;
  filterMaxMileage: number | null = null;
  filterVehicle = '';
  sortMileageAsc = true;

  constructor(
    private tiresService: TiresService,
    private carsService: CarsService
  ) {}

  ngOnInit(): void {
    this.fetchTires();
    this.fetchCars();
  }

  private initTireForm(): ITire {
    return {
      brand: '',
      model: '',
      installationDate: '',
      mileageAtInstallation: 0,
      replacementReason: '',
      vehicleId: 0
    };
  }

  private fetchCars(): void {
    this.carsService.getAllVehicles().subscribe({
      next: (cars) => this.cars = cars,
      error: (error) => console.error('Error fetching cars:', error)
    });
  }

  private fetchTires(): void {
    this.tiresService.getAllTires().subscribe({
      next: (tires) => {
        this.tires = tires;
        this.applyFilters();
      },
      error: (error) => console.error('Error fetching tires:', error)
    });
  }

  openAddForm(): void {
    this.tireForm = this.initTireForm();
    this.isEditing = false;
    this.showForm = true;
  }

  startEdit(tire: ITire): void {
    this.tireForm = { ...tire, installationDate: tire.installationDate.toString() };
    this.isEditing = true;
    this.showForm = true;
  }

  addTire(): void {
    if (!this.isValidForm()) return;

    const formattedTire = this.formatTire(this.tireForm);
    this.tiresService.createTire(formattedTire).subscribe({
      next: (tire) => {
        this.tires.push(tire);
        this.closeForm();
        this.applyFilters();
        alert('Tire added successfully!');
      },
      error: (error) => {
        console.error('Error adding tire:', error);
        alert('Failed to add tire.');
      }
    });
  }

  saveEditedTire(): void {
    if (!this.isValidForm() || !this.tireForm.id) return;

    const formattedTire = this.formatTire(this.tireForm);
    this.tiresService.updateTire(this.tireForm.id, formattedTire).subscribe({
      next: () => {
        const index = this.tires.findIndex(t => t.id === this.tireForm.id);
        if (index !== -1) {
          this.tires[index] = formattedTire;
          this.applyFilters();
        }
        this.closeForm();
        alert('Tire updated successfully!');
      },
      error: (error) => {
        console.error('Error updating tire:', error);
        alert('Failed to update tire.');
      }
    });
  }

  deleteTire(id: number): void {
    if (!confirm('Are you sure you want to delete this tire?')) return;

    this.tiresService.deleteTire(id).subscribe({
      next: () => {
        this.tires = this.tires.filter(tire => tire.id !== id);
        this.applyFilters();
        alert('Tire deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting tire:', error);
        alert('Failed to delete tire.');
      }
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.tireForm = this.initTireForm();
  }

  private isValidForm(): boolean {
    return !!(this.tireForm.brand.trim() && this.tireForm.model.trim() && this.tireForm.vehicleId);
  }

  private formatTire(tire: ITire): ITire {
    return { ...tire, installationDate: this.formatDate(tire.installationDate) };
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getVehicleModel(vehicleId: number): string {
    const car = this.cars.find(c => c.id === vehicleId);
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'N/A';
  }

  applyFilters(): void {
    let filteredData = [...this.tires];

    // Filter by brand
    if (this.filterBrand) {
      filteredData = filteredData.filter(tire => 
        tire.brand.toLowerCase().includes(this.filterBrand.toLowerCase())
      );
    }

    // Filter by model
    if (this.filterModel) {
      filteredData = filteredData.filter(tire => 
        tire.model.toLowerCase().includes(this.filterModel.toLowerCase())
      );
    }

    // Filter by date range
    if (this.filterStartDate) {
      filteredData = filteredData.filter(tire => 
        new Date(tire.installationDate) >= this.filterStartDate!
      );
    }
    if (this.filterEndDate) {
      filteredData = filteredData.filter(tire => 
        new Date(tire.installationDate) <= this.filterEndDate!
      );
    }

    // Filter by mileage range
    if (this.filterMinMileage !== null) {
      filteredData = filteredData.filter(tire => 
        tire.mileageAtInstallation >= this.filterMinMileage!
      );
    }
    if (this.filterMaxMileage !== null) {
      filteredData = filteredData.filter(tire => 
        tire.mileageAtInstallation <= this.filterMaxMileage!
      );
    }

    // Filter by vehicle
    if (this.filterVehicle) {
      filteredData = filteredData.filter(tire => 
        this.getVehicleModel(tire.vehicleId).toLowerCase()
          .includes(this.filterVehicle.toLowerCase())
      );
    }

    // Sort by mileage
    filteredData.sort((a, b) => 
      this.sortMileageAsc ? a.mileageAtInstallation - b.mileageAtInstallation : 
                            b.mileageAtInstallation - a.mileageAtInstallation
    );

    this.tires = filteredData;
  }

  resetFilters(): void {
    this.filterBrand = '';
    this.filterModel = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterMinMileage = null;
    this.filterMaxMileage = null;
    this.filterVehicle = '';
    this.fetchTires();
  }

  toggleMileageSort(): void {
    this.sortMileageAsc = !this.sortMileageAsc;
    this.applyFilters();
  }
}