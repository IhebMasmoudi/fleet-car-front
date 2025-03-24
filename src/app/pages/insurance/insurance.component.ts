// components/insurance/insurance.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Insurance } from '../../interfaces/IInsurance';
import { InsuranceService } from 'src/app/services/Insurance.service';
import { ICars } from '../../interfaces/ICars';
import { CarsService } from 'src/app/services/Cars.service';
import { MatTableDataSource } from '@angular/material/table';
import { DatePipe, CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-insurance',
  templateUrl: './insurance.component.html',
  styleUrls: ['./insurance.component.scss'],
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
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsuranceComponent implements OnInit {
  insurances: Insurance[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;

  showAddForm: boolean = false;
  isEditing: boolean = false;
  filtersExpanded: boolean = false;

  policyNumber: string = '';
  provider: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  cost: number = 0;
  status: string = 'Active';
  vehicleID: number | null = null;

  selectedInsurance: Insurance | null = null;

  filterPolicyNumber: string = '';
  filterProvider: string = '';
  filterStatus: string = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  displayedColumns: string[] = ['policyNumber', 'provider', 'startDate', 'endDate', 'cost', 'status', 'car', 'actions'];
  dataSource = new MatTableDataSource<Insurance>(this.insurances);

  constructor(
    private insuranceService: InsuranceService,
    private carsService: CarsService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchInsurances();
    this.fetchCars();
  }

  fetchInsurances(): void {
    this.isLoading = true;
    this.insuranceService.getAllInsurances().subscribe(
      (records) => {
        this.insurances = records;
        this.dataSource.data = this.insurances;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error fetching insurances:', error);
        this.errorMessage = 'Error fetching insurance records.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    );
  }

  fetchCars(): void {
    this.carsService.getAllVehicles().subscribe(
      (cars) => {
        this.cars = cars;
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error fetching cars:', error);
        this.cdr.markForCheck();
      }
    );
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedInsurance = null;
    this.policyNumber = '';
    this.provider = '';
    this.startDate = null;
    this.endDate = null;
    this.cost = 0;
    this.status = 'Active';
    this.vehicleID = null;
    this.showAddForm = false;
    this.cdr.markForCheck();
  }

  addInsurance(): void {
    if (!this.policyNumber || !this.provider || !this.startDate || !this.endDate || !this.vehicleID) {
      alert('Please fill in the required fields.');
      return;
    }

    const newInsurance: Insurance = {
      id: 0,
      policyNumber: this.policyNumber,
      provider: this.provider,
      startDate: this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || '',
      endDate: this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || '',
      cost: this.cost,
      status: this.status,
      vehicleID: this.vehicleID
    };

    this.insuranceService.createInsurance(newInsurance).subscribe(
      (record) => {
        this.insurances.push(record);
        this.dataSource.data = this.insurances;
        this.resetForm();
        this.applyFilters();
        alert('Insurance record added successfully!');
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error adding insurance:', error);
        alert('Failed to add insurance record.');
        this.cdr.markForCheck();
      }
    );
  }

  startEdit(record: Insurance): void {
    this.selectedInsurance = { ...record };
    this.isEditing = true;
    this.showAddForm = true;
    this.policyNumber = record.policyNumber;
    this.provider = record.provider;
    this.startDate = new Date(record.startDate);
    this.endDate = new Date(record.endDate);
    this.cost = record.cost;
    this.status = record.status;
    this.vehicleID = record.vehicleID;
    this.cdr.markForCheck();
  }

  saveEditedInsurance(): void {
    if (!this.policyNumber || !this.provider || !this.startDate || !this.endDate || !this.vehicleID || !this.selectedInsurance) {
      alert('Please fill in the required fields.');
      return;
    }

    const updatedInsurance: Insurance = {
      ...this.selectedInsurance,
      policyNumber: this.policyNumber,
      provider: this.provider,
      startDate: this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || '',
      endDate: this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || '',
      cost: this.cost,
      status: this.status,
      vehicleID: this.vehicleID
    };

    this.insuranceService.updateInsurance(this.selectedInsurance.id, updatedInsurance).subscribe(
      () => {
        const index = this.insurances.findIndex(i => i.id === this.selectedInsurance?.id);
        if (index !== -1) {
          this.insurances[index] = updatedInsurance;
          this.dataSource.data = this.insurances;
        }
        this.resetForm();
        this.applyFilters();
        alert('Insurance record updated successfully!');
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error updating insurance:', error);
        alert('Failed to update insurance record.');
        this.cdr.markForCheck();
      }
    );
  }

  deleteInsurance(record: Insurance): void {
    if (!confirm('Are you sure you want to delete this insurance record?')) return;

    this.insuranceService.deleteInsurance(record.id).subscribe(
      () => {
        this.insurances = this.insurances.filter(i => i.id !== record.id);
        this.dataSource.data = this.insurances;
        this.applyFilters();
        alert('Insurance record deleted successfully!');
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error deleting insurance:', error);
        alert('Failed to delete insurance record.');
        this.cdr.markForCheck();
      }
    );
  }

  cancelEdit(): void {
    this.resetForm();
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
    this.cdr.markForCheck();
  }

  applyFilters(): void {
    let filteredData = [...this.insurances];

    if (this.filterPolicyNumber) {
      filteredData = filteredData.filter(rec =>
        rec.policyNumber.toLowerCase().includes(this.filterPolicyNumber.toLowerCase())
      );
    }

    if (this.filterProvider) {
      filteredData = filteredData.filter(rec =>
        rec.provider.toLowerCase().includes(this.filterProvider.toLowerCase())
      );
    }

    if (this.filterStatus) {
      filteredData = filteredData.filter(rec => rec.status === this.filterStatus);
    }

    if (this.filterStartDate) {
      filteredData = filteredData.filter(rec => new Date(rec.startDate) >= this.filterStartDate!);
    }

    if (this.filterEndDate) {
      filteredData = filteredData.filter(rec => new Date(rec.endDate) <= this.filterEndDate!);
    }

    this.dataSource.data = filteredData;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.filterPolicyNumber = '';
    this.filterProvider = '';
    this.filterStatus = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.dataSource.data = this.insurances;
    this.cdr.markForCheck();
  }

  getVehicleModel(vehicleID: number): string {
    const car = this.cars.find(c => c.id === vehicleID);
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'N/A';
  }

  openCarDetails(vehicleID: number): void {
    console.log(`Car details requested for vehicle ID: ${vehicleID}`);
    alert(`Car details requested for vehicle ID: ${vehicleID}. Implement navigation or a dialog as needed.`);
  }

  getRowClass(record: Insurance): string {
    const today = new Date();
    const endDate = new Date(record.endDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);

    if (dayDiff < 0) {
      return 'expired-row';
    } else if (dayDiff <= 30) {
      return 'warning-row';
    }
    return '';
  }

  isExpiring(endDateStr: string): boolean {
    const today = new Date();
    const endDate = new Date(endDateStr);
    const timeDiff = endDate.getTime() - today.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    return dayDiff >= 0 && dayDiff <= 30;
  }

  clearFilterPolicyNumber(): void {
    this.filterPolicyNumber = '';
    this.applyFilters();
  }

  clearFilterProvider(): void {
    this.filterProvider = '';
    this.applyFilters();
  }

  // New properties to calculate counts in the component class
  get activePoliciesCount(): number { // Added getter for active policies count
    return this.insurances.filter(i => i.status === 'Active').length;
  }

  get expiringSoonPoliciesCount(): number { // Added getter for expiring policies count
    return this.insurances.filter(i => this.isExpiring(i.endDate)).length;
  }
}