import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router'; // Import Router if needed for navigation
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip'; // Import MatTooltipModule
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table'; // Ensure MatTableModule is imported if used
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select'; // Keep if used by other imports
import { MatMenuModule } from '@angular/material/menu'; // Keep if used by other imports
import { MatDatepickerModule } from '@angular/material/datepicker'; // Keep if used by other imports


import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { CarsService } from 'src/app/services/Cars.service';
import { DocumentService } from 'src/app/services/document.service';
// import { UserService } from 'src/app/services/UserService.service'; // Keep if used
import { ICarDetails } from 'src/app/interfaces/Icardetails';
// import { IUser } from 'src/app/interfaces/IUser'; // Keep if used

@Component({
  selector: 'app-car-details',
  standalone: true, // Make it standalone
  templateUrl: './car-detaills.component.html',
  styleUrls: ['./car-detaills.component.scss'], // Use the SCSS file
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTableModule,
    MatOptionModule,
    MatSelectModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush // Set Change Detection
})
export class CarDetailsComponent implements OnInit, OnDestroy {
  // --- State Properties ---
  carId: number | null = null;
  carDetails: ICarDetails | null = null;
  errorMessage: string = '';
  isLoading: boolean = false;
  loadingDocument: { [key: string]: boolean } = {};

  // --- Pagination and Filtering ---
  @ViewChild('insurancePaginator') insurancePaginator!: MatPaginator;
  @ViewChild('tiresPaginator') tiresPaginator!: MatPaginator;
  @ViewChild('fuelPaginator') fuelPaginator!: MatPaginator;
  @ViewChild('missionsPaginator') missionsPaginator!: MatPaginator;

  pageSize = 6;
  pageSizeOptions = [6, 12, 24, 48];
  
  // Insurance records
  totalInsuranceRecords = 0;
  filteredInsuranceRecords: any[] = [];
  
  // Tires records
  tiresDataSource = new MatTableDataSource<any>();
  
  // Fuel consumption records
  fuelDataSource = new MatTableDataSource<any>();
  
  // Missions records
  missionsDataSource = new MatTableDataSource<any>();
  private filterValue = '';


  // --- RxJS Subject for Unsubscribing ---
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private carsService: CarsService,
    private documentService: DocumentService,
    // private userService: UserService, // Keep if used
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private router: Router // Inject Router if needed for back button etc.
  ) {}

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        this.carId = id ? Number(id) : null;
        if (this.carId) {
          this.fetchCarDetails(this.carId);
        } else {
          this.errorMessage = 'Invalid Car ID provided.';
          this.isLoading = false; // Ensure loading is off if ID is invalid
          this.cdr.markForCheck();
          // Optionally navigate back or show a more permanent error
        }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Fetching ---
  fetchCarDetails(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.carDetails = null; // Clear previous details
    this.cdr.markForCheck();

    this.carsService.getVehicleDetails(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (details) => {
          this.carDetails = details;
          this.initializeInsuranceData(details);
          this.initializeTiresData(details);
          this.initializeFuelData(details);
          this.initializeMissionsData(details);
          console.log('Fetched car details:', details);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching car details:', error);
          // Provide a more user-friendly error message if possible
          const specificError = error?.error?.message || 'An unknown error occurred.';
          this.errorMessage = `Error fetching car details: ${specificError}`;
          this.showNotification('Failed to load vehicle details.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  // --- Actions ---
  viewDocument(vehicleID: number | undefined, documentName: string | undefined): void {
    if (vehicleID === undefined || !documentName) {
        this.showNotification('Cannot view document: Invalid ID or name.', 'error');
        return;
    }

    const loadingKey = `${vehicleID}-${documentName}`;
    this.loadingDocument[loadingKey] = true;
    this.cdr.markForCheck();

    this.documentService.downloadDocument(vehicleID, documentName)
        .pipe(
            takeUntil(this.destroy$), // Add takeUntil here too if component might be destroyed during download
            finalize(() => {
                this.loadingDocument[loadingKey] = false;
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (blob) => {
                try {
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    // Optional: Revoke URL after some time or on window close if possible
                    // window.URL.revokeObjectURL(url); // Be careful with timing
                } catch (e) {
                     console.error('Error creating object URL or opening window:', e);
                     this.showNotification('Failed to open document.', 'error');
                }
            },
            error: (error) => {
                console.error('Error viewing document:', error);
                this.showNotification('Failed to download or view document.', 'error');
            }
        });
    }


    // --- Navigation ---
    goBack(): void {
         this.router.navigate(['/cars']);
    }


    // --- UI Helpers ---
    getVehicleStatusClass(status: string | undefined): string {
        if (!status) return 'status-unknown';
        switch (status.toLowerCase()) {
        case 'active': return 'status-active';
        case 'maintenance': return 'status-maintenance';
        case 'inactive': return 'status-inactive';
        default: return 'status-unknown';
        }
    }

    getInvoiceStatusClass(status: string | undefined): string {
        if (!status) return 'invoice-unknown';
        switch (status.toLowerCase()) {
        case 'paid': return 'invoice-paid';
        case 'overdue': return 'invoice-overdue';
        case 'pending': return 'invoice-pending';
        default: return 'invoice-unknown';
        }
    }

    getMissionStatusClass(status: string | undefined): string {
        if (!status) return 'mission-unknown';
        switch (status.toLowerCase()) {
        case 'completed': return 'mission-completed';
        case 'in progress': return 'mission-ongoing';
        case 'planned': return 'mission-planned';
        default: return 'mission-unknown';
        }
    }

    // Insurance handling methods
    initializeInsuranceData(details: ICarDetails) {
      this.carDetails = details;
      this.totalInsuranceRecords = details.insuranceRecords?.length || 0;
      this.filteredInsuranceRecords = details.insuranceRecords || [];
      this.applyPagination();
      this.cdr.markForCheck();
    }

    // Initialize data sources
    initializeTiresData(details: ICarDetails): void {
      if (details.tires) {
        this.tiresDataSource.data = details.tires;
        this.tiresDataSource.paginator = this.tiresPaginator;
      }
    }

    initializeFuelData(details: ICarDetails): void {
      if (details.fuelConsumption) {
        this.fuelDataSource.data = details.fuelConsumption;
        this.fuelDataSource.paginator = this.fuelPaginator;
      }
    }

    initializeMissionsData(details: ICarDetails): void {
      if (details.missions) {
        this.missionsDataSource.data = details.missions;
        this.missionsDataSource.paginator = this.missionsPaginator;
      }
    }

    applyInsuranceFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filterValue = filterValue.trim().toLowerCase();
      if (this.carDetails?.insuranceRecords) {
        this.filteredInsuranceRecords = this.carDetails.insuranceRecords.filter(insurance =>
          insurance.policyNumber.toLowerCase().includes(this.filterValue) ||
          insurance.provider.toLowerCase().includes(this.filterValue)
        );
      }
      this.totalInsuranceRecords = this.filteredInsuranceRecords.length;
      if (this.insurancePaginator) {
        this.insurancePaginator.firstPage();
      }
      this.applyPagination();
      this.cdr.markForCheck();
    }

    onPageChange(event: any): void {
      this.pageSize = event.pageSize;
      this.applyPagination();
      this.cdr.markForCheck();
    }

    private applyPagination(): void {
      if (!this.insurancePaginator) return;
      
      const startIndex = this.insurancePaginator.pageIndex * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      
      if (this.carDetails?.insuranceRecords) {
        const filtered = this.filterValue
          ? this.filteredInsuranceRecords
          : this.carDetails.insuranceRecords;
          
        this.filteredInsuranceRecords = filtered.slice(startIndex, endIndex);
      }
    }

    getParkingStatusClass(status: string | undefined): string {
        if (!status) return 'parking-unknown';
        switch (status.toLowerCase()) {
        case 'occupied': return 'parking-occupied'; // Or use 'reserved' if that's the status value
        case 'available': return 'parking-available';
        default: return 'parking-unknown';
        }
    }

    getInsuranceStatusClass(status: string | undefined): string {
        if (!status) return 'status-unknown';
        switch (status.toLowerCase()) {
            case 'active': return 'status-active';
            case 'expired': return 'status-inactive';
            case 'pending': return 'status-pending';
            default: return 'status-unknown';
        }
    }

     getDocumentIcon(docType: string | undefined): string {
        if (!docType) return 'description'; // Default icon
        const type = docType.toLowerCase();
        if (type.includes('pdf')) return 'picture_as_pdf';
        if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return 'image';
        if (type.includes('doc')) return 'article'; // Word document
        if (type.includes('xls')) return 'spreadsheet'; // Excel
        return 'description'; // Generic fallback
     }


    // Helper for notifications
    private showNotification(message: string, type: 'success' | 'error'): void {
        this.snackBar.open(message, 'Close', {
        duration: 3000,
        panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'], // Use array
        horizontalPosition: 'end',
        verticalPosition: 'top',
        });
    }
}