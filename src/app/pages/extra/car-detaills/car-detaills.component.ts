import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CarsService } from 'src/app/services/Cars.service';
import { ICarDetails } from 'src/app/interfaces/Icardetails';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-car-details',
  templateUrl: './car-detaills.component.html',
  styleUrls: ['./car-detaills.component.scss'],
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
    MatNativeDateModule,
    MatTabsModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
})
export class CarDetailsComponent implements OnInit {
  carId: number | null = null;
  carDetails: ICarDetails | null = null;
  errorMessage: string | null = null;

  constructor(private route: ActivatedRoute, private carsService: CarsService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      // Retrieve the 'id' parameter from the URL
      this.carId = Number(params.get('id'));
      if (this.carId) {
        this.fetchCarDetails(this.carId);
      }
    });
  }

  fetchCarDetails(id: number): void {
    this.carsService.getVehicleDetails(id).subscribe(
      (details) => {
        this.carDetails = details;
      },
      (error) => {
        console.error('Error fetching car details:', error);
        this.errorMessage = 'Error fetching car details.';
      }
    );
  }
}