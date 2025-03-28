// --- Core Angular Imports ---
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
// --- Angular Forms Imports ---
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms'; // ReactiveForms for robust forms, FormsModule for [(ngModel)] in filters
// --- Angular Router Imports ---
import { Router } from '@angular/router'; // For programmatic navigation
// --- Angular Common Imports ---
import { CommonModule } from '@angular/common'; // Provides common directives like *ngIf, *ngFor

// --- Angular Material Imports ---
// Provides UI components for table, pagination, cards, forms, buttons, icons, menus, etc.
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog'; // Included for potential future use (e.g., confirmation dialogs)
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

// --- RxJS Imports ---
// For handling asynchronous operations and managing observable streams
import { forkJoin, finalize, switchMap, map, of, Subject, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators'; // Specifically for handling errors within observable chains

// --- Application Specific Imports ---
import { CarsService } from 'src/app/services/Cars.service'; // Service for vehicle data operations
import { DocumentService } from 'src/app/services/document.service'; // Service for document CRUD & download
import { ICars } from 'src/app/interfaces/ICars'; // Backend data model for a car
import { Document } from 'src/app/interfaces/IDocument'; // Backend data model for a document

/**
 * @interface ICarViewModel
 * Extends the backend `ICars` interface with UI-specific state properties,
 * like photo loading status and the temporary URL for displaying the photo.
 */
interface ICarViewModel extends ICars {
  loadingPhoto?: boolean; // Tracks if the primary photo is currently being fetched.
  photoUrl?: string;      // Holds the Blob URL for the car's photo display.
}

@Component({
  selector: 'app-cars', // How this component is used in HTML templates
  standalone: true,    // Component manages its own dependencies
  imports: [           // Modules needed by this component's template
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // For ngModel on filter inputs
    MatTableModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatTooltipModule, MatDialogModule,
    MatSnackBarModule, MatSelectModule, MatPaginatorModule,
  ],
  templateUrl: './cars.component.html', // Structure of the component's view
  styleUrls: ['./cars.component.scss'],   // Styles specific to this component
  changeDetection: ChangeDetectionStrategy.OnPush // Optimizes change detection; requires manual triggering (`cdr.markForCheck()`) for async updates not tied to @Input changes or template events.
})
export class CarsComponent implements OnInit, OnDestroy, AfterViewInit {

  // --- State Properties ---
  /** Master list containing all fetched cars, enhanced with view-specific state (ICarViewModel). */
  allCars: ICarViewModel[] = [];
  /** Filtered and sorted subset of `allCars` used specifically for the *ngFor loop in Card View. */
  carsForView: ICarViewModel[] = [];
  /** Reactive form group instance managing add/edit car form controls and validation. */
  carForm: FormGroup;
  /** Tracks whether the form is currently used for editing an existing car. */
  isEditing = false;
  /** Controls the visibility of the add/edit car form section. */
  showForm = false;
  /** Controls the visibility of the document management section. */
  showDocuments = false;
  /** Stores the ID of the car whose documents are being displayed/managed. */
  selectedCarId: number | null = null;
  /** Holds the list of documents fetched for the `selectedCarId`. */
  documents: Document[] = [];
  /** General loading flag, used for actions like save, delete, upload, etc., often tied to button states. */
  loading = false;
  /** Specific loading flag for the initial fetch of the main car list. */
  isLoading = false;
  /** Stores error messages for display in the UI (e.g., fetch failures). */
  errorMessage: string = '';
  /** Determines the current display layout ('card' or 'list'). */
  viewMode: 'card' | 'list' = 'card';
  /** Controls the expanded/collapsed state of the filter panel. */
  filtersExpanded = false;

  // --- Filter & Sort Properties --- (Bound using [(ngModel)] in the template)
  filterBrand: string = '';
  filterModel: string = '';
  filterLicensePlate: string = '';
  filterMinYear: number | null = null;
  filterMaxYear: number | null = null;
  filterStatus: string = ''; // Empty string means 'All'
  filterType: string = '';   // Empty string means 'All'
  /** Tracks the current sort direction for the brand property (used in `applyFilters`). */
  sortBrandAsc: boolean = true;
  /** Static list of options for the status filter dropdown. */
  readonly availableStatuses: string[] = ['Available', 'In Use', 'Under Maintenance'];
  /** Static list of options for the type filter dropdown. */
  readonly availableTypes: string[] = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van'];

  // --- Table & Paginator Properties ---
  /** Material Table data source; connects the filtered/sorted data to the table component. */
  dataSource = new MatTableDataSource<ICarViewModel>([]);
  /** Defines the columns displayed in the main car table. */
  readonly displayedColumns: string[] = ['id', 'brand', 'model', 'licensePlate', 'year', 'status', 'actions'];
  /** Defines the columns displayed in the documents table. */
  readonly documentColumns: string[] = ['id', 'documentName', 'documentType', 'actions'];
  /** Tracks the current number of items per page (synced with paginator). */
  pageSize = 10;
  /** Tracks the current page index (zero-based) (synced with paginator). */
  pageIndex = 0;

  // --- ViewChild ---
  /** Provides access to the MatPaginator instance declared in the template. `!` asserts it will be available after view init. */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // --- RxJS Subject for Unsubscribing ---
  /** Used to automatically unsubscribe from observables when the component is destroyed, preventing memory leaks. */
  private readonly destroy$ = new Subject<void>();

  /**
   * Component constructor. Injects necessary services via Dependency Injection.
   * Initializes the reactive form.
   */
  constructor(
    private carsService: CarsService,           // Service for car API interactions
    private fb: FormBuilder,                    // Service to build reactive forms
    private router: Router,                     // Service for navigation
    private documentService: DocumentService,   // Service for document API interactions
    private snackBar: MatSnackBar,              // Service to show temporary notifications
    private cdr: ChangeDetectorRef              // Service to manually trigger change detection (needed for OnPush)
  ) {
    // Set up the form structure and validators immediately on component creation.
    this.carForm = this.initializeForm();
  }

  // --- Lifecycle Hooks ---

  /**
   * `ngOnInit`: Called once after the component's inputs are initialized.
   * Ideal place for initial data fetching.
   */
  ngOnInit(): void {
    this.fetchCars();
  }

  /**
   * `ngAfterViewInit`: Called once after the component's view and child views are fully initialized.
   * Necessary for accessing `@ViewChild` elements like the paginator.
   */
  ngAfterViewInit(): void {
    // Connect the paginator instance from the template to the table's data source.
    this.dataSource.paginator = this.paginator;
  }

  /**
   * `ngOnDestroy`: Called just before Angular destroys the component.
   * Essential for cleanup to prevent memory leaks.
   */
  ngOnDestroy(): void {
    // Signal all observables subscribed with `takeUntil(this.destroy$)` to complete.
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up any Blob URLs created for displaying photos/documents.
    this.revokeAllBlobUrls();
  }

  /** Helper to revoke all created blob URLs. */
  private revokeAllBlobUrls(): void {
    [...this.allCars, ...this.carsForView].forEach(car => { // Combine both arrays to be safe
      if (car.photoUrl && car.photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(car.photoUrl);
        car.photoUrl = undefined; // Clear reference
      }
    });
    // TODO: Add similar revocation if document previews create blob URLs that aren't automatically cleaned up.
  }

  // --- Form Initialization ---

  /**
   * Creates and configures the reactive form group for car data.
   * @returns The initialized FormGroup.
   */
  private initializeForm(): FormGroup {
    const currentYear = new Date().getFullYear();
    return this.fb.group({
      id: [null], // Handled by backend for new; populated for edit
      model: ['', Validators.required],
      brand: ['', Validators.required],
      licensePlate: ['', Validators.required], // Could add Validators.pattern(...) here
      year: [null, [Validators.required, Validators.min(1950), Validators.max(currentYear + 1)]],
      fuelType: ['', Validators.required],
      mileage: [null, [Validators.required, Validators.min(0)]],
      status: ['', Validators.required], // Should match one of `availableStatuses`
      type: ['', Validators.required],   // Should match one of `availableTypes`
    });
  }

  // --- Data Fetching ---

  /**
   * Fetches all vehicles from the service, maps them to the view model,
   * handles loading states, triggers photo loading, and updates the view.
   */
  fetchCars(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck(); // Signal change detection start

    this.carsService.getAllVehicles()
      .pipe(
        takeUntil(this.destroy$), // Auto-unsubscribe on component destruction
        map(cars => cars.map(car => ({ // Transform backend data to view model
          ...car,
          loadingPhoto: true, // Initialize photo loading state
          photoUrl: undefined   // Initialize photo URL
        } as ICarViewModel))),
        finalize(() => { // Executes on completion or error
          this.isLoading = false;
          this.cdr.markForCheck(); // Signal change detection end
        })
      )
      .subscribe({
        next: (carsViewModel) => {
          this.revokeAllBlobUrls(); // Clean up URLs from previous data set
          this.allCars = carsViewModel; // Update the master list
          this.applyFilters();        // Apply filters/sort to update views
          this.loadCarPhotos();       // Initiate loading of primary photos
          // No cdr.markForCheck() needed here, covered by applyFilters & finalize
        },
        error: (error) => {
          console.error('Error fetching cars:', error);
          this.errorMessage = 'Failed to load vehicle data. Please try again later.';
          this.allCars = [];      // Reset data on error
          this.applyFilters();    // Ensure views reflect empty data
          // No cdr.markForCheck() needed here, covered by applyFilters & finalize
        }
      });
  }

  /**
   * Loads the primary photo for each car in `allCars`.
   * Finds a photo document, downloads the blob, creates a URL, and updates the car view model.
   * Uses `forkJoin` for parallel execution and `catchError` for individual resilience.
   */
  private loadCarPhotos(): void {
    if (!this.allCars.length) return; // Don't run if there are no cars

    // Create an array of observables, each responsible for fetching one car's photo
    const photoRequests = this.allCars.map(car =>
      this.documentService.getDocumentsByVehicleId(car.id!)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(documents => {
            // Identify the primary photo document (e.g., first image type found)
            const photoDoc = documents.find(doc => /\.(png|jpg|jpeg|webp)$/i.test(doc.documentName)); // More robust check using regex
            if (!photoDoc) {
              car.loadingPhoto = false; // Update state directly if no photo found
              return of(null); // Emit null to signal no photo download needed for this car
            }
            // If found, download the photo blob
            return this.documentService.downloadDocument(car.id!, photoDoc.documentName)
              .pipe(
                map((blob: Blob) => ({ carId: car.id!, blob })), // Package result with car ID
                catchError(photoError => { // Handle errors for *this specific* photo download
                  console.error(`Error loading photo for car ${car.id} (${photoDoc.documentName}):`, photoError);
                  car.loadingPhoto = false; // Update state on error
                  return of(null); // Emit null so forkJoin doesn't fail entirely
                })
              );
          }),
          finalize(() => {
            // Ensure loading state is false after attempting to find/load photo
            if (car.loadingPhoto) { car.loadingPhoto = false; }
            this.cdr.markForCheck(); // Trigger UI update for this car's loading state change
          })
        )
    );

    // Execute all photo requests in parallel
    forkJoin(photoRequests)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe from the forkJoin itself
      .subscribe(results => {
        // Process results once all requests complete
        results.forEach(result => {
          if (result?.blob) {
            const car = this.allCars.find(c => c.id === result.carId);
            if (car) {
              // Revoke previous URL if it exists
              if (car.photoUrl && car.photoUrl.startsWith('blob:')) {
                URL.revokeObjectURL(car.photoUrl);
              }
              // Create and assign new Blob URL
              car.photoUrl = URL.createObjectURL(result.blob);
            }
          }
        });
        // Re-apply filters if photoUrl changes might affect the view (e.g., broken image placeholders)
        this.applyFilters();
        this.cdr.markForCheck(); // Final update after processing all photo results
      });
  }


  // --- CRUD Operations ---

  /** Sets up the UI to add a new car. */
  openAddForm(): void {
    this.isEditing = false;
    this.showDocuments = false; // Hide other sections
    this.showForm = true;       // Show the form
    this.carForm.reset();       // Clear previous values/errors
    // Consider setting defaults: this.carForm.patchValue({ status: 'Available', year: ... });
    this.cdr.markForCheck();
  }

  /** Sets up the UI to edit an existing car, pre-filling the form. */
  startEdit(car: ICarViewModel): void {
    this.isEditing = true;
    this.showDocuments = false; // Hide other sections
    this.showForm = true;       // Show the form
    this.carForm.patchValue(car); // Load car data into the form
    this.cdr.markForCheck();
  }

  /** Central form submission logic; delegates to add or update based on `isEditing`. */
  submitCarForm(): void {
    if (this.carForm.invalid) {
      this.showNotification('Please fill in all required fields correctly.', 'error');
      this.carForm.markAllAsTouched(); // Show validation errors on all fields
      return;
    }
    this.loading = true; // Show loading state
    this.cdr.markForCheck();

    if (this.isEditing) {
      this.saveEditedCar();
    } else {
      this.addCar();
    }
  }

  /** Handles API call to create a new car. */
  private addCar(): void {
    const carData: ICars = { ...this.carForm.value };
    delete carData.id; // Ensure ID is not sent for creation

    this.carsService.createVehicle(carData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (newCar) => {
          const newCarViewModel: ICarViewModel = { ...newCar, loadingPhoto: true }; // Prepare view model
          this.allCars.push(newCarViewModel); // Add to master list
          this.closeForm();           // Hide form
          this.applyFilters();        // Update displayed lists
          this.loadCarPhotos();       // Try to load photo for the new car
          this.showNotification('Vehicle added successfully!', 'success');
        },
        error: (error) => this.handleApiError(error, 'Failed to add vehicle')
      });
  }

  /** Handles API call to update an existing car. */
  private saveEditedCar(): void {
    const carId = this.carForm.value.id;
    if (!carId) {
      this.handleApiError(null, 'Cannot update vehicle: ID missing.', true); // Treat as local error
      return;
    }

    const updatedCarData: ICars = this.carForm.value;

    this.carsService.updateVehicle(carId, updatedCarData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (updatedCar) => {
          const index = this.allCars.findIndex(car => car.id === carId);
          if (index !== -1) {
            // Preserve existing UI state (photo) while updating data from backend
            const existingViewModel = this.allCars[index];
            this.allCars[index] = {
              ...updatedCar, // Data from backend
              photoUrl: existingViewModel.photoUrl, // Keep existing photo URL
              loadingPhoto: existingViewModel.loadingPhoto // Keep existing loading state
            };
            // Consider reloading photo if backend could have changed association: this.loadCarPhotos();
          }
          this.closeForm();
          this.applyFilters();
          this.showNotification('Vehicle updated successfully!', 'success');
        },
        error: (error) => this.handleApiError(error, 'Failed to update vehicle')
      });
  }

  /** Handles API call to delete a car, after confirmation. */
  deleteCar(id: number): void {
    // Simple browser confirmation; consider using MatDialog for better UX.
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return;

    this.loading = true;
    this.cdr.markForCheck();

    // Find car to revoke URL before deleting from backend/list
    const carToRemove = this.allCars.find(car => car.id === id);

    this.carsService.deleteVehicle(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: () => {
          // Revoke photo URL before removing from array
          if (carToRemove?.photoUrl && carToRemove.photoUrl.startsWith('blob:')) {
            URL.revokeObjectURL(carToRemove.photoUrl);
          }
          // Remove from the master list
          this.allCars = this.allCars.filter(car => car.id !== id);
          this.applyFilters(); // Update displayed lists
          this.showNotification('Vehicle deleted successfully!', 'success');
        },
        error: (error) => this.handleApiError(error, 'Failed to delete vehicle. Associated records might exist.')
      });
  }

  /** Hides the add/edit form and resets its state. */
  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.carForm.reset();
    this.cdr.markForCheck();
  }

  // --- Filtering, Sorting, Pagination ---

  /**
   * Filters and sorts the `allCars` list based on current filter/sort properties,
   * then updates `carsForView` and `dataSource.data`. Triggers change detection.
   */
  applyFilters(): void {
    let filtered = [...this.allCars]; // Work on a copy

    // Apply filters sequentially
    const brand = this.filterBrand.toLowerCase();
    if (brand) filtered = filtered.filter(c => c.brand.toLowerCase().includes(brand));

    const model = this.filterModel.toLowerCase();
    if (model) filtered = filtered.filter(c => c.model.toLowerCase().includes(model));

    const plate = this.filterLicensePlate.toLowerCase();
    if (plate) filtered = filtered.filter(c => c.licensePlate.toLowerCase().includes(plate));

    if (this.filterMinYear != null) filtered = filtered.filter(c => c.year >= this.filterMinYear!);
    if (this.filterMaxYear != null) filtered = filtered.filter(c => c.year <= this.filterMaxYear!);

    if (this.filterStatus) filtered = filtered.filter(c => c.status === this.filterStatus);
    if (this.filterType) filtered = filtered.filter(c => c.type === this.filterType);

    // Apply sorting
    filtered.sort((a, b) => {
      const compare = a.brand.localeCompare(b.brand);
      return this.sortBrandAsc ? compare : -compare;
    });

    // Update data sources for views
    this.carsForView = filtered;
    this.dataSource.data = filtered;

    // Reset paginator to first page if it exists
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    this.cdr.markForCheck(); // Signal that data for the view has changed
  }

  /** Resets all filter inputs and re-applies filtering/sorting. */
  resetFilters(): void {
    this.filterBrand = ''; this.filterModel = ''; this.filterLicensePlate = '';
    this.filterMinYear = null; this.filterMaxYear = null;
    this.filterStatus = ''; this.filterType = '';
    this.sortBrandAsc = true; // Reset sort direction
    this.applyFilters();
  }

  /** Toggles the brand sort direction and re-applies filters/sort. */
  toggleBrandSort(): void {
    this.sortBrandAsc = !this.sortBrandAsc;
    this.applyFilters();
  }

  /** Handles the page change event from the paginator. */
  onPageChange(event: any): void { // MatPageEvent type is cleaner if available
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    // Note: No need to manually slice data; MatTableDataSource handles this.
  }

  // --- View Mode ---

  /** Switches between 'card' and 'list' view modes. */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
    this.cdr.markForCheck();
  }

  // --- Document Handling ---

  /** Initiates the document upload process for a specific car. */
  uploadDocument(carId: number): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png,.jpg,.jpeg,.pdf,.webp,.doc,.docx'; // Allowed types

    input.onchange = (event: any) => {
      const file: File = event.target.files?.[0];
      if (!file) return;

      const defaultName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const docName = prompt('Enter Document Name:', defaultName);

      if (docName?.trim()) {
        const docType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        this.loading = true;
        this.cdr.markForCheck();

        this.documentService.uploadDocument(carId, docName.trim(), docType, file)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => { this.loading = false; this.cdr.markForCheck(); })
          )
          .subscribe({
            next: () => {
              this.showNotification('Document uploaded successfully!', 'success');
              // Refresh document list if currently shown for this car
              if (this.showDocuments && this.selectedCarId === carId) {
                this.fetchDocumentsForCar(carId);
              }
              this.loadCarPhotos(); // Reload photos in case it was an image
            },
            error: (error) => this.handleApiError(error, 'Failed to upload document')
          });
      } else if (docName !== null) { // User entered empty name
        this.showNotification('Document name cannot be empty.', 'error');
      } // If docName is null, user cancelled prompt - do nothing.
    };
    input.click(); // Open file dialog
  }

  /** Shows the document list section for a specific car and fetches its documents. */
  viewDocuments(carId: number): void {
    this.selectedCarId = carId;
    this.showForm = false;      // Hide other sections
    this.showDocuments = true;  // Show document list
    this.fetchDocumentsForCar(carId);
    this.cdr.markForCheck();
  }

  /** Fetches documents for the currently selected car. */
  private fetchDocumentsForCar(carId: number): void {
    this.loading = true; // Show loading state for document list
    this.cdr.markForCheck();
    this.documentService.getDocumentsByVehicleId(carId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (docs) => { this.documents = docs; },
        error: (error) => {
          this.documents = []; // Clear list on error
          this.handleApiError(error, 'Failed to load documents');
        }
      });
  }

  /** Downloads a specific document blob and triggers browser download. */
  downloadDocument(vehicleID: number, documentName: string): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.documentService.downloadDocument(vehicleID, documentName)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (blob) => {
          try {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = documentName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Clean up blob URL
          } catch (e) { this.handleApiError(e, 'Failed to initiate download', true); }
        },
        error: (error) => this.handleApiError(error, 'Failed to download document')
      });
  }

  /** Opens a document in a new tab by creating a blob URL. */
  viewDocument(vehicleID: number, documentName: string): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.documentService.downloadDocument(vehicleID, documentName)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (blob) => {
          try {
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Note: Cannot revoke URL immediately as the new tab needs it.
            // Relying on browser cleanup here.
          } catch (e) { this.handleApiError(e, 'Failed to open document for viewing', true); }
        },
        error: (error) => this.handleApiError(error, 'Failed to load document for viewing')
      });
  }

  /** Deletes a specific document after confirmation. */
  deleteDocument(documentId: number, vehicleId: number): void {
    if (!confirm('Are you sure you want to delete this document?')) return;

    this.loading = true;
    this.cdr.markForCheck();
    this.documentService.deleteDocument(documentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: () => {
          this.documents = this.documents.filter(doc => doc.id !== documentId); // Update local list
          this.showNotification('Document deleted successfully!', 'success');
          // Potentially reload car photos if the deleted doc could have been the primary image
          this.loadCarPhotos();
        },
        error: (error) => this.handleApiError(error, 'Failed to delete document')
      });
  }

  /** Hides the document view section. */
  closeDocuments(): void {
    this.showDocuments = false;
    this.selectedCarId = null;
    this.documents = [];
    this.cdr.markForCheck();
  }

  // --- Navigation ---

  /** Navigates to the detail page for a specific car. */
  seeDetails(id: number): void {
    this.router.navigate(['/extra/CarDetaills', id]); // Assumes this route exists
  }

  // --- UI Helpers ---

  /** Displays a snackbar notification. */
  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: type === 'error' ? 5000 : 3000, // Longer duration for errors
      panelClass: [`${type}-snackbar`], // Apply 'success-snackbar', 'error-snackbar', or 'info-snackbar' class
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  /** Centralized API error handling (logs, shows notification). */
  private handleApiError(error: any, defaultMessage: string, isLocalError = false): void {
    if (!isLocalError) console.error(`${defaultMessage}:`, error); // Log backend errors
    // Try to get a more specific message from the error object
    const message = error?.error?.message || error?.message || defaultMessage;
    this.showNotification(message, 'error');
    this.loading = false; // Ensure loading is reset on error
    this.cdr.markForCheck();
  }


  /** Returns a display string for the currently selected car (e.g., for document view header). */
  getSelectedCarIdentifier(): string {
    if (!this.selectedCarId) return 'Vehicle';
    const car = this.allCars.find(c => c.id === this.selectedCarId);
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : `Vehicle #${this.selectedCarId}`;
  }

  /** Returns a CSS class based on car status for styling badges/indicators. */
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'available': return 'active-badge'; // E.g., Green
      case 'in use': return 'warning-badge'; // E.g., Orange
      case 'under maintenance': return 'expired-badge'; // E.g., Red
      default: return '';
    }
  }

  // --- Clear Filter Methods --- (Simple helpers for clear buttons in template)
  clearFilterBrand(): void { this.filterBrand = ''; this.applyFilters(); }
  clearFilterModel(): void { this.filterModel = ''; this.applyFilters(); }
  clearFilterLicensePlate(): void { this.filterLicensePlate = ''; this.applyFilters(); }
  clearFilterMinYear(): void { this.filterMinYear = null; this.applyFilters(); }
  clearFilterMaxYear(): void { this.filterMaxYear = null; this.applyFilters(); }

  // --- Calculated Stats Getters --- (For display in template)
   get totalCarsCount(): number { return this.allCars.length; }
   get availableCarsCount(): number { return this.allCars.filter(c => c.status === 'Available').length; }
   get inUseCarsCount(): number { return this.allCars.filter(c => c.status === 'In Use').length; }
   get maintenanceCarsCount(): number { return this.allCars.filter(c => c.status === 'Under Maintenance').length; }
}