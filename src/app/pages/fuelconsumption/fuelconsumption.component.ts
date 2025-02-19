import { Component } from '@angular/core';
import { IFuelConsumption } from 'src/app/interfaces/IFuelConsumption';
import { OnInit } from '@angular/core';
import { FuelConsumptionsService } from 'src/app/services/FuelConsumption.Service';
import { MatTableDataSource } from '@angular/material/table';
import { ICars } from 'src/app/interfaces/ICars';
import { CarsService } from 'src/app/services/Cars.service';
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
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-fuelconsumption',
  templateUrl: './fuelconsumption.component.html',
  styleUrls: ['./fuelconsumption.component.scss'],
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
  ],
  providers: [DatePipe]
})
export class FuelConsumptionComponent implements OnInit {

  fuelConsumptions: IFuelConsumption[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';

  showAddForm: boolean = false;
  isEditing: boolean = false;

  fuelDate: Date | null = null;
  fuelTime: string = '';
  fuelAmount: number = 0;
  fuelCost: number = 0;
  fuelMileage: number = 0;
  fuelVehicleID: number | null = null;

  selectedFuelConsumption: IFuelConsumption | null = null;

  displayedColumns: string[] = ['date', 'amount', 'cost', 'mileage', 'vehicle', 'actions'];
  dataSource = new MatTableDataSource<IFuelConsumption>(this.fuelConsumptions);

  constructor(
    private fuelConsumptionsService: FuelConsumptionsService,
    private carsService: CarsService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.fetchFuelConsumptions();
    this.fetchCars();
  }

  fetchFuelConsumptions(): void {
    this.fuelConsumptionsService.getAllFuelConsumptions().subscribe(
      (records) => {
        this.fuelConsumptions = records;
        this.dataSource.data = this.fuelConsumptions;
        console.log('Fetched fuel consumptions:', records);
      },
      (error) => {
        console.error('Error fetching fuel consumptions:', error);
        this.errorMessage = 'Error fetching fuel consumption records.';
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
    this.selectedFuelConsumption = null;
    this.fuelDate = null;
    this.fuelTime = '';
    this.fuelAmount = 0;
    this.fuelCost = 0;
    this.fuelMileage = 0;
    this.fuelVehicleID = null;
  }

  addFuelConsumption(): void {
    if (!this.fuelDate || !this.fuelTime || !this.fuelVehicleID) {
      alert('Please fill in the required fields.');
      return;
    }

    const newRecord: IFuelConsumption = {
      date: this.combineDateAndTime(this.fuelDate, this.fuelTime),
      amount: this.fuelAmount,
      cost: this.fuelCost,
      mileage: this.fuelMileage,
      vehicleID: this.fuelVehicleID
    };
    console.log(newRecord);
    this.fuelConsumptionsService.createFuelConsumption(newRecord).subscribe(
      (record) => {
        this.fuelConsumptions.push(record);
        this.dataSource.data = this.fuelConsumptions;
        this.resetForm();
        this.showAddForm = false;
        alert('Fuel consumption record added successfully!');
      },
      (error) => {
        console.error('Error adding fuel consumption:', error);
        alert('Failed to add fuel consumption record.');
      }
    );
  }

  startEdit(record: IFuelConsumption): void {
    this.selectedFuelConsumption = { ...record };
    this.isEditing = true;
    this.showAddForm = true;

    this.fuelDate = new Date(record.date);
    this.fuelTime = this.extractTime(record.date);
    this.fuelAmount = record.amount;
    this.fuelCost = record.cost;
    this.fuelMileage = record.mileage;
    this.fuelVehicleID = record.vehicleID;
  }

  saveEditedFuelConsumption(): void {
    if (!this.fuelDate || !this.fuelTime || !this.fuelVehicleID) {
      alert('Please fill in the required fields.');
      return;
    }

    if (!this.selectedFuelConsumption) return;

    const updatedRecord: IFuelConsumption = {
      ...this.selectedFuelConsumption,
      date: this.combineDateAndTime(this.fuelDate, this.fuelTime),
      amount: this.fuelAmount,
      cost: this.fuelCost,
      mileage: this.fuelMileage,
      vehicleID: this.fuelVehicleID
    };
    console.log(updatedRecord);
    this.fuelConsumptionsService.updateFuelConsumption(this.selectedFuelConsumption.id!, updatedRecord).subscribe(
      () => {
        const index = this.fuelConsumptions.findIndex(f => f.id === this.selectedFuelConsumption?.id);
        if (index !== -1) {
          this.fuelConsumptions[index] = updatedRecord;
          this.dataSource.data = this.fuelConsumptions;
        }
        this.cancelEdit();
        alert('Fuel consumption record updated successfully!');
      },
      (error) => {
        console.error('Error updating fuel consumption:', error);
        alert('Failed to update fuel consumption record.');
      }
    );
  }

  cancelEdit(): void {
    this.resetForm();
    this.showAddForm = false;
  }

  deleteFuelConsumption(id: number): void {
    if (!confirm('Are you sure you want to delete this fuel consumption record?')) return;

    this.fuelConsumptionsService.deleteFuelConsumption(id).subscribe(
      () => {
        this.fuelConsumptions = this.fuelConsumptions.filter(f => f.id !== id);
        this.dataSource.data = this.fuelConsumptions;
        alert('Fuel consumption record deleted successfully!');
      },
      (error) => {
        console.error('Error deleting fuel consumption:', error);
        alert('Failed to delete fuel consumption record.');
      }
    );
  }

  combineDateAndTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours, minutes);
    return this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm:ss') || '';
  }

  extractTime(dateTime: string): string {
    const date = new Date(dateTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getVehicleModel(vehicleID: number): string {
    const car = this.cars.find(c => c.id === vehicleID);
    return car ? car.model : 'N/A';
  }
}