import { Component, OnInit } from '@angular/core';
import { TiresService } from '../../services/Tires.Service';
import { ITire } from '../../interfaces/ITire';
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
import { CarsService } from '../../services/Cars.service';
import { ICars } from '../../interfaces/ICars';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
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
    MatOptionModule,
    MatSelectModule,
    MatMenuModule
  ],
})
export class TiresComponent implements OnInit {
  cars: ICars[] = [];
  tires: ITire[] = [];
  displayedColumns: string[] = ['brand', 'model', 'installationDate', 'mileageAtInstallation', 'actions'];
  newTire: ITire = {
    brand: '',
    model: '',
    installationDate: '',
    mileageAtInstallation: 0,
    replacementReason: '',
    vehicleId: 0,
  };
  editedTire: ITire = {
    id: 0,
    brand: '',
    model: '',
    installationDate: '',
    mileageAtInstallation: 0,
    replacementReason: '',
   vehicleId: 0,
  };
  isEditing = false;
  showForm = false;

  constructor(private tiresService: TiresService, private carsService: CarsService) {}

  ngOnInit(): void {
    this.fetchTires();
    this.fetchCars();
  }

  /**
   * Fetch all cars from the server.
   */
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

  /**
   * Fetch all tires from the server.
   */
  fetchTires(): void {
    this.tiresService.getAllTires().subscribe(
      (tires) => {
        this.tires = tires;
      },
      (error) => {
        console.error('Error fetching tires:', error);
      }
    );
  }

  /**
   * Open the form in "add" mode.
   */
  openAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.newTire = {
      brand: '',
      model: '',
      installationDate: '',
      mileageAtInstallation: 0,
      replacementReason: '',
      vehicleId: 0,
    };
  }

  /**
   * Open the form in "edit" mode for the selected tire.
   * @param tire The tire to edit.
   */
  startEdit(tire: ITire): void {
    this.editedTire = { ...tire };
    this.isEditing = true;
    this.showForm = true;
  }

  /**
   * Add a new tire.
   */
  addTire(): void {
    if (!this.newTire.brand.trim() || !this.newTire.model.trim() || !this.newTire.
    vehicleId) return;
  
    const formattedTire = { ...this.newTire, installationDate: this.formatDate(this.newTire.installationDate) };
    console.log('Tire added:', formattedTire);
    this.tiresService.createTire(formattedTire).subscribe(
      (tire) => {
        this.tires.push(tire);
        this.closeForm();
        console.log('Tire added:', tire);
        alert('Tire added successfully!');
      },
      (error) => {
        console.error('Error adding tire:', error);
        alert('Failed to add tire.');
      }
    );
  }
  
  saveEditedTire(): void {
    if (!this.editedTire.brand.trim() || !this.editedTire.model.trim() || !this.editedTire.
    vehicleId) return;
  
    const formattedTire = { ...this.editedTire, installationDate: this.formatDate(this.editedTire.installationDate) };
  
    this.tiresService.updateTire(this.editedTire.id!, formattedTire).subscribe(
      () => {
        const index = this.tires.findIndex((tire) => tire.id === this.editedTire.id);
        if (index !== -1) {
          this.tires[index] = this.editedTire;
        }
        this.closeForm();
        alert('Tire updated successfully!');
      },
      (error) => {
        console.error('Error updating tire:', error);
        alert('Failed to update tire.');
      }
    );
  }
  
  /**
   * Cancel the current form action.
   */
  cancelEdit(): void {
    this.closeForm();
  }

  /**
   * Delete a tire by ID.
   * @param id The ID of the tire to delete.
   */
  deleteTire(id: number): void {
    if (!confirm('Are you sure you want to delete this tire?')) return;
    this.tiresService.deleteTire(id).subscribe(
      () => {
        this.tires = this.tires.filter((tire) => tire.id !== id);
        alert('Tire deleted successfully!');
      },
      (error) => {
        console.error('Error deleting tire:', error);
        alert('Failed to delete tire.');
      }
    );
  }

  /**
   * Hide the form and display the table.
   */
  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
  }

  /**
   * Format a date to 'YYYY-MM-DD' string.
   * @param date The date to format.
   * @returns Formatted date string.
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}