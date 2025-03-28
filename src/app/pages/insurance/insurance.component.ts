// components/insurance/insurance.component.ts

// --- Core Angular Imports ---
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core'; // Core decorators, lifecycle hooks, and change detection tools
import { DatePipe, CommonModule } from '@angular/common'; // For date formatting and common directives (*ngIf, *ngFor)

// --- Angular Material Imports ---
// Provides UI components for table, cards, forms, buttons, icons, menus, datepicker, etc.
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms'; // Enables template-driven forms and [(ngModel)] for filters/form
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core'; // Required by MatDatepicker
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// --- Application Specific Imports ---
import { Insurance } from '../../interfaces/IInsurance'; // Data model for insurance records
import { InsuranceService } from 'src/app/services/Insurance.service'; // Service for insurance API operations
import { ICars } from '../../interfaces/ICars'; // Data model for cars (used for lookup)
import { CarsService } from 'src/app/services/Cars.service'; // Service to fetch car data

@Component({
  selector: 'app-insurance', // How this component is used in HTML
  templateUrl: './insurance.component.html', // Component's HTML structure
  styleUrls: ['./insurance.component.scss'],   // Component-specific styles
  standalone: true, // Manages its own dependencies via 'imports'
  imports: [ // List required modules for the template
    MatTableModule, MatCardModule, MatButtonModule, CommonModule, MatIconModule,
    MatSelectModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatMenuModule, MatNativeDateModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  providers: [DatePipe], // Provides DatePipe for formatting dates in the component logic (e.g., before sending to API)
  changeDetection: ChangeDetectionStrategy.OnPush // Optimizes performance; requires manual change detection triggers (`cdr.markForCheck()`) for async operations or state changes not automatically detected.
})
export class InsuranceComponent implements OnInit {
  // --- State Properties ---
  /** Master list of all fetched insurance records. */
  insurances: Insurance[] = [];
  /** List of cars fetched for populating the vehicle dropdown and displaying vehicle info. */
  cars: ICars[] = [];
  /** Holds error messages for display in the UI (e.g., fetch failures). */
  errorMessage: string = '';
  /** Controls the visibility of the main loading spinner (during initial data fetch). */
  isLoading: boolean = false;
  /** Toggles the visibility of the add/edit form section. */
  showAddForm: boolean = false;
  /** Tracks if the form is currently being used for editing an existing record. */
  isEditing: boolean = false;
  /** Controls the expanded/collapsed state of the filter panel. */
  filtersExpanded: boolean = false;

  // --- Form Fields (bound with [(ngModel)]) ---
  policyNumber: string = '';
  provider: string = '';
  startDate: Date | null = null; // Use Date object for datepicker binding
  endDate: Date | null = null;   // Use Date object for datepicker binding
  cost: number = 0;
  status: string = 'Active'; // Default status for new records
  vehicleID: number | null = null; // ID of the associated vehicle

  /** Holds the insurance record currently being edited. */
  selectedInsurance: Insurance | null = null;

  // --- Filter Fields (bound with [(ngModel)]) ---
  filterPolicyNumber: string = '';
  filterProvider: string = '';
  filterStatus: string = '';
  filterStartDate: Date | null = null; // Use Date object for datepicker filter binding
  filterEndDate: Date | null = null;   // Use Date object for datepicker filter binding

  // --- Table Configuration ---
  /** Defines the columns displayed in the Material table. */
  readonly displayedColumns: string[] = ['policyNumber', 'provider', 'startDate', 'endDate', 'cost', 'status', 'car', 'actions'];
  /** Material Table data source; connects the filtered insurance data to the table component. */
  dataSource = new MatTableDataSource<Insurance>(this.insurances);

  /**
   * Component constructor. Injects necessary services and utilities.
   */
  constructor(
    private insuranceService: InsuranceService, // Service for insurance data operations
    private carsService: CarsService,           // Service for fetching car details
    private datePipe: DatePipe,                 // Utility for formatting date values (e.g., for API)
    private cdr: ChangeDetectorRef              // Service to manually trigger change detection (required by OnPush)
  ) { }

  /**
   * `ngOnInit`: Angular lifecycle hook called once after component initialization.
   * Used here to fetch initial data needed by the component.
   */
  ngOnInit(): void {
    this.fetchInsurances(); // Load insurance records
    this.fetchCars();      // Load car data for dropdown/lookup
  }

  /**
   * Fetches all insurance records from the service, updates the local state and table datasource.
   * Handles loading indicators and basic error logging.
   */
  fetchInsurances(): void {
    this.isLoading = true;
    this.errorMessage = ''; // Clear previous errors
    this.cdr.markForCheck(); // Signal start of async operation

    this.insuranceService.getAllInsurances().subscribe({
      next: (records) => {
        this.insurances = records;        // Store fetched data
        this.dataSource.data = this.insurances; // Update table source
        this.applyFilters();              // Apply any active filters
        this.isLoading = false;
        this.cdr.markForCheck(); // Signal completion and data update
      },
      error: (error) => {
        console.error('Error fetching insurances:', error);
        this.errorMessage = 'Error fetching insurance records.';
        this.insurances = []; // Clear data on error
        this.dataSource.data = this.insurances;
        this.isLoading = false;
        this.cdr.markForCheck(); // Signal completion with error state
      }
    });
  }

  /**
   * Fetches all car records from the service. Primarily used for the vehicle dropdown in the form
   * and for displaying car details in the table.
   */
  fetchCars(): void {
    // Doesn't need its own isLoading as it's less critical than the main insurance list
    this.carsService.getAllVehicles().subscribe({
      next: (cars) => {
        this.cars = cars;
        this.cdr.markForCheck(); // Update view if car data affects dropdowns etc.
      },
      error: (error) => {
        console.error('Error fetching cars:', error);
        // Potentially show a non-blocking error or just log it
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Resets the form fields, editing state, and hides the form.
   * Centralized logic for clearing the form state.
   */
  resetForm(): void {
    this.isEditing = false;
    this.selectedInsurance = null;
    // Clear form model properties
    this.policyNumber = '';
    this.provider = '';
    this.startDate = null;
    this.endDate = null;
    this.cost = 0;
    this.status = 'Active'; // Reset to default
    this.vehicleID = null;
    this.showAddForm = false; // Ensure form is hidden
    this.cdr.markForCheck(); // Update view (hide form, clear inputs)
  }

  /**
   * Handles the creation of a new insurance record.
   * Performs basic validation, formats data (dates), calls the service, and updates the UI.
   * Uses basic `alert` for feedback; consider using MatSnackBar for better UX.
   */
  addInsurance(): void {
    // Basic required field validation
    if (!this.policyNumber || !this.provider || !this.startDate || !this.endDate || !this.vehicleID) {
      alert('Please fill in all required fields (Policy #, Provider, Dates, Vehicle).'); // Simple feedback
      return;
    }

    // Prepare data for the API, formatting dates using DatePipe
    const newInsurance: Omit<Insurance, 'id'> = {
      policyNumber: this.policyNumber,
      provider: this.provider,
      startDate: this.datePipe.transform(this.startDate, 'yyyy-MM-dd')!, // Use '!' assuming date will be valid if check passes
      endDate: this.datePipe.transform(this.endDate, 'yyyy-MM-dd')!,   // Use '!' assuming date will be valid if check passes
      cost: this.cost,
      status: this.status,
      vehicleID: this.vehicleID
    };

    // Assume `isLoading` or another flag should be set here for button state
    // this.loading = true; this.cdr.markForCheck();

    this.insuranceService.createInsurance(newInsurance).subscribe({
      next: (record) => {
        this.insurances.push(record); // Add new record to the master list
        this.dataSource.data = [...this.insurances]; // Update table (create new array ref)
        this.resetForm();             // Clear and hide the form
        this.applyFilters();          // Re-apply filters (though new item might not match)
        alert('Insurance record added successfully!'); // Simple feedback
        // this.loading = false;
        this.cdr.markForCheck(); // Update view
      },
      error: (error) => {
        console.error('Error adding insurance:', error);
        alert('Failed to add insurance record.'); // Simple feedback
        // this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Prepares the form for editing an existing insurance record.
   * Populates form fields with the selected record's data and shows the form.
   * @param record The insurance record to edit.
   */
  startEdit(record: Insurance): void {
    this.selectedInsurance = { ...record }; // Store the original record being edited
    this.isEditing = true;
    this.showAddForm = true;
    // Populate form fields
    this.policyNumber = record.policyNumber;
    this.provider = record.provider;
    // Convert string dates back to Date objects for the datepicker
    this.startDate = new Date(record.startDate);
    this.endDate = new Date(record.endDate);
    this.cost = record.cost;
    this.status = record.status;
    this.vehicleID = record.vehicleID;
    this.cdr.markForCheck(); // Update view to show populated form
  }

  /**
   * Handles the update of an existing insurance record.
   * Performs validation, formats data, calls the service, and updates the UI.
   * Uses basic `alert` for feedback.
   */
  saveEditedInsurance(): void {
    // Basic validation and ensure a record is actually being edited
    if (!this.policyNumber || !this.provider || !this.startDate || !this.endDate || !this.vehicleID || !this.selectedInsurance) {
      alert('Please fill in all required fields.');
      return;
    }

    // Prepare updated data, including the ID, formatting dates
    const updatedInsurance: Insurance = {
      ...this.selectedInsurance, // Include the ID and any unchanged fields
      policyNumber: this.policyNumber,
      provider: this.provider,
      startDate: this.datePipe.transform(this.startDate, 'yyyy-MM-dd')!,
      endDate: this.datePipe.transform(this.endDate, 'yyyy-MM-dd')!,
      cost: this.cost,
      status: this.status,
      vehicleID: this.vehicleID
    };

    // Assume `isLoading` or another flag should be set here
    // this.loading = true; this.cdr.markForCheck();

    this.insuranceService.updateInsurance(this.selectedInsurance.id, updatedInsurance).subscribe({
      next: (response) => { // Assume API returns the updated record or success indicator
        const index = this.insurances.findIndex(i => i.id === this.selectedInsurance?.id);
        if (index !== -1) {
          // Update the record in the master list (use response if available, otherwise use submitted data)
          this.insurances[index] = response ? { ...response } : updatedInsurance; // Adapt based on API response
          this.dataSource.data = [...this.insurances]; // Update table
        }
        this.resetForm();    // Clear and hide the form
        this.applyFilters(); // Re-apply filters
        alert('Insurance record updated successfully!'); // Simple feedback
        // this.loading = false;
        this.cdr.markForCheck(); // Update view
      },
      error: (error) => {
        console.error('Error updating insurance:', error);
        alert('Failed to update insurance record.'); // Simple feedback
        // this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Handles the deletion of an insurance record after confirmation.
   * Calls the service and updates the local data source.
   * Uses basic `alert` and `confirm`.
   * @param record The insurance record to delete.
   */
  deleteInsurance(record: Insurance): void {
    // Simple browser confirmation; consider MatDialog for better UX
    if (!confirm(`Are you sure you want to delete policy ${record.policyNumber}?`)) return;

    // Assume `isLoading` or another flag should be set here
    // this.loading = true; this.cdr.markForCheck();

    this.insuranceService.deleteInsurance(record.id).subscribe({
      next: () => {
        // Remove the record from the master list
        this.insurances = this.insurances.filter(i => i.id !== record.id);
        this.dataSource.data = this.insurances; // Update table (filter creates new array)
        this.applyFilters(); // Re-apply filters
        alert('Insurance record deleted successfully!'); // Simple feedback
        // this.loading = false;
        this.cdr.markForCheck(); // Update view
      },
      error: (error) => {
        console.error('Error deleting insurance:', error);
        alert('Failed to delete insurance record.'); // Simple feedback
        // this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Alias for resetting the form when cancelling an edit or add operation. */
  cancelEdit(): void {
    this.resetForm();
  }

  /** Toggles the visibility of the add/edit form panel. Resets form if hiding. */
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.isEditing && !this.showAddForm) {
      // If user was editing and closes the form, ensure edit state is fully reset
      this.resetForm();
    } else if (!this.showAddForm) {
      // If user was adding (not editing) and closes, just reset fields
      this.isEditing = false;
      this.selectedInsurance = null;
      // Reset form fields without necessarily hiding (if toggleAddForm only collapses)
      // This depends on how resetForm() behaves and if toggleAddForm is reused.
      // Calling resetForm() is generally safer.
      this.resetForm();
    }
    this.cdr.markForCheck();
  }

  /**
   * Filters the `insurances` array based on the current filter criteria
   * and updates the `dataSource.data` for the table.
   */
  applyFilters(): void {
    let filteredData = [...this.insurances]; // Start with a copy of the master list

    // Apply text filters (case-insensitive)
    if (this.filterPolicyNumber) {
      const policyLower = this.filterPolicyNumber.toLowerCase();
      filteredData = filteredData.filter(rec => rec.policyNumber.toLowerCase().includes(policyLower));
    }
    if (this.filterProvider) {
      const providerLower = this.filterProvider.toLowerCase();
      filteredData = filteredData.filter(rec => rec.provider.toLowerCase().includes(providerLower));
    }

    // Apply status filter
    if (this.filterStatus) {
      filteredData = filteredData.filter(rec => rec.status === this.filterStatus);
    }

    // Apply date range filters (compare Date objects for accurate range checks)
    if (this.filterStartDate) {
      const filterStart = this.filterStartDate; // Already a Date object
      filteredData = filteredData.filter(rec => new Date(rec.startDate) >= filterStart);
    }
    if (this.filterEndDate) {
      const filterEnd = this.filterEndDate; // Already a Date object
      // When filtering by end date, usually you want policies ending *on or before* that date.
      filteredData = filteredData.filter(rec => new Date(rec.endDate) <= filterEnd);
    }

    this.dataSource.data = filteredData; // Update the table's data source
    this.cdr.markForCheck(); // Signal that the data for the view has changed
  }

  /** Resets all filter fields to their default values and updates the table data. */
  resetFilters(): void {
    this.filterPolicyNumber = '';
    this.filterProvider = '';
    this.filterStatus = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.dataSource.data = this.insurances; // Show all data again
    this.cdr.markForCheck(); // Update view
  }

  /**
   * Retrieves a display string (Brand Model (License Plate)) for a given vehicle ID.
   * Uses the locally cached `cars` array for lookup.
   * @param vehicleID The ID of the vehicle to look up.
   * @returns Formatted string or 'N/A' if not found.
   */
  getVehicleModel(vehicleID: number): string {
    const car = this.cars.find(c => c.id === vehicleID);
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'N/A';
  }

  /** Placeholder function to handle clicking on a vehicle link/button. Should navigate or open details. */
  openCarDetails(vehicleID: number): void {
    // TODO: Implement actual navigation (e.g., using Router) or open a MatDialog
    console.log(`Car details requested for vehicle ID: ${vehicleID}`);
    alert(`Implement navigation or dialog for car ID: ${vehicleID}.`);
  }

  /**
   * Determines a CSS class for table rows based on the insurance end date.
   * Used for visually highlighting expired or soon-to-expire policies.
   * @param record The insurance record for the row.
   * @returns CSS class name ('expired-row', 'warning-row', or '').
   */
  getRowClass(record: Insurance): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day for consistent comparison
    const endDate = new Date(record.endDate);
    endDate.setHours(0, 0, 0, 0); // Normalize end date

    const timeDiff = endDate.getTime() - today.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24); // Calculate difference in days

    if (dayDiff < 0) {
      return 'expired-row'; // Ended in the past
    } else if (dayDiff <= 30) {
      return 'warning-row'; // Ends within the next 30 days (inclusive of today)
    }
    return ''; // No special styling needed
  }

  /**
   * Checks if an insurance policy is expiring within the next 30 days (including today).
   * Helper function used for conditional display or logic.
   * @param endDateStr The end date string from the insurance record.
   * @returns True if expiring within 30 days, false otherwise.
   */
  isExpiring(endDateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);

    const timeDiff = endDate.getTime() - today.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);

    // Check if end date is today or within the next 30 days
    return dayDiff >= 0 && dayDiff <= 30;
  }

  // --- Clear Filter Methods --- (Helpers for template clear buttons)
  clearFilterPolicyNumber(): void { this.filterPolicyNumber = ''; this.applyFilters(); }
  clearFilterProvider(): void { this.filterProvider = ''; this.applyFilters(); }
  // Note: Select/Date filters are cleared via ngModel binding in the template (setting to null/empty)

  // --- Calculated Stats Getters --- (Provide counts for display in template)
  /** Calculates the number of policies with 'Active' status. */
  get activePoliciesCount(): number {
    return this.insurances.filter(i => i.status === 'Active').length;
  }

  /** Calculates the number of policies expiring within 30 days. */
  get expiringSoonPoliciesCount(): number {
    return this.insurances.filter(i => i.status === 'Active' && this.isExpiring(i.endDate)).length; // Often only care about *active* policies expiring
  }
}