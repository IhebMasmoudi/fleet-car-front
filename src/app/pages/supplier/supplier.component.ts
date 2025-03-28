import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Keep FormsModule for template-driven forms
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // Import Paginator if using
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core'; // Keep dependencies
import { MatSelectModule } from '@angular/material/select'; // Keep if filters might use it later
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog'; // Keep if needed later

import { Subject } from 'rxjs';
import { takeUntil, finalize, map } from 'rxjs/operators';

import { ISupplier } from '../../interfaces/ISupplier';
import { SuppliersService } from '../../services/Supplier.Service';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule, // Keep available
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule, // Keep available
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatPaginatorModule, // Keep available
    MatOptionModule // Keep available
  ],
  // No providers needed here unless using DatePipe etc.
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss'], // Point to the SCSS file
  changeDetection: ChangeDetectionStrategy.OnPush // Set Change Detection Strategy
})
export class SupplierComponent implements OnInit, OnDestroy {

  // --- State Properties ---
  allSuppliers: ISupplier[] = []; // Master list
  errorMessage: string = '';
  isLoading: boolean = false;         // Loading indicator for data fetching
  loading: boolean = false;           // Loading indicator for actions (add, update, delete)
  showAddForm: boolean = false;
  isEditing: boolean = false;
  filtersExpanded: boolean = false;
  selectedSupplier: ISupplier | null = null;

  // --- Form Fields (template-driven) ---
  supplierName: string = '';
  supplierContactInfo: string = '';
  supplierServicesOffered: string = '';

  // --- Filter Properties ---
  filterName: string = '';
  filterContactInfo: string = '';
  filterServices: string = '';
  sortNameAsc: boolean = true; // Sort by name ascending initially

  // --- Table Properties ---
  dataSource = new MatTableDataSource<ISupplier>([]);
  // Keep ID column or remove if not needed in display
  displayedColumns: string[] = ['name', 'contactInfo', 'servicesOffered', 'actions'];

  // --- Paginator ---
  // @ViewChild(MatPaginator) paginator!: MatPaginator; // Uncomment if using

  // --- RxJS Subject for Unsubscribing ---
  private destroy$ = new Subject<void>();

  constructor(
    private suppliersService: SuppliersService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private snackBar: MatSnackBar // Inject MatSnackBar
    // private dialog: MatDialog // Inject MatDialog if needed
  ) {}

  // --- Lifecycle Hooks ---

  ngOnInit(): void {
    this.fetchSuppliers();
  }

  // ngAfterViewInit(): void { // Uncomment if using paginator
  //   this.dataSource.paginator = this.paginator;
  // }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Fetching ---

  fetchSuppliers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.suppliersService.getAllSuppliers()
      .pipe(
        takeUntil(this.destroy$),
        // Sort by name initially
        map(records => records.sort((a, b) => a.name.localeCompare(b.name))),
        finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (records) => {
          this.allSuppliers = records;
          this.applyFilters(); // Apply filters which updates dataSource
          console.log('Fetched suppliers:', records);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching suppliers:', error);
          this.errorMessage = 'Error fetching supplier records.';
          this.allSuppliers = [];
          this.applyFilters(); // Clear table
          this.showNotification('Failed to load supplier records.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  // --- Form Handling & CRUD ---

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm(); // Clear form when closing
    } else {
        this.isEditing = false; // Ensure not editing when opening fresh
        this.resetForm(); // Clear previous edit state
    }
    this.cdr.markForCheck();
  }

  resetForm(): void {
    // Clear form model properties
    this.supplierName = '';
    this.supplierContactInfo = '';
    this.supplierServicesOffered = '';
    // Reset editing state
    this.isEditing = false;
    this.selectedSupplier = null;
    this.cdr.markForCheck();
  }

  submitSupplierForm(): void {
    // Central submit, validation via template #supplierForm.invalid
    if (!this.supplierName.trim() || !this.supplierContactInfo.trim() || !this.supplierServicesOffered.trim()) {
        this.showNotification('Please fill all required fields (Name, Contact, Services).', 'error');
        return;
    }

    if (this.isEditing) {
      this.saveEditedSupplier();
    } else {
      this.addSupplier();
    }
  }

  addSupplier(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const newRecord: Omit<ISupplier, 'id'> = { // Type without ID for creation
      name: this.supplierName.trim(),
      contactInfo: this.supplierContactInfo.trim(),
      servicesOffered: this.supplierServicesOffered.trim()
    };

    this.suppliersService.createSupplier(newRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (record) => {
                this.allSuppliers.unshift(record); // Add to beginning of master list
                // Or: this.allSuppliers.push(record); this.allSuppliers.sort(...);
                this.applyFilters();          // Update table data
                this.showAddForm = false;     // Close form
                this.resetForm();             // Clear form fields
                this.showNotification('Supplier added successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error adding supplier:', error);
                this.showNotification('Failed to add supplier.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

  startEdit(record: ISupplier): void {
    this.selectedSupplier = { ...record };
    this.isEditing = true;

    // Populate form fields
    this.supplierName = record.name;
    this.supplierContactInfo = record.contactInfo;
    this.supplierServicesOffered = record.servicesOffered;

    this.showAddForm = true; // Show the form
    this.cdr.markForCheck();
  }

  saveEditedSupplier(): void {
    if (!this.selectedSupplier || this.selectedSupplier.id === undefined) {
        this.showNotification('Cannot update: Original record ID missing.', 'error');
        return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const updatedRecord: ISupplier = {
      ...this.selectedSupplier, // Keep original ID
      name: this.supplierName.trim(),
      contactInfo: this.supplierContactInfo.trim(),
      servicesOffered: this.supplierServicesOffered.trim()
    };

    this.suppliersService.updateSupplier(this.selectedSupplier.id, updatedRecord)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (updatedFromServer) => { // Assuming backend returns the updated record
                const index = this.allSuppliers.findIndex(s => s.id === this.selectedSupplier?.id);
                if (index !== -1) {
                    this.allSuppliers[index] = updatedFromServer; // Update master list
                }
                 this.applyFilters();      // Update table data
                this.showAddForm = false; // Close form
                this.resetForm();         // Clear form fields and editing state
                this.showNotification('Supplier updated successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error updating supplier:', error);
                this.showNotification('Failed to update supplier.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

   cancelEdit(): void {
    this.showAddForm = false; // Hide the form
    this.resetForm();       // Clear form fields and editing state
    this.cdr.markForCheck();
  }


  deleteSupplier(id: number | undefined): void {
     if (id === undefined) {
         this.showNotification('Cannot delete: Supplier ID is missing.', 'error');
         return;
     };
    if (!confirm('Are you sure you want to delete this supplier record?')) return;

    this.loading = true; // Use general loading flag for button disable
    this.cdr.markForCheck();

    this.suppliersService.deleteSupplier(id)
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
          })
       )
      .subscribe({
        next: () => {
          this.allSuppliers = this.allSuppliers.filter(s => s.id !== id); // Remove from master list
          this.applyFilters(); // Update table data
          this.showNotification('Supplier deleted successfully!', 'success');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          this.showNotification('Failed to delete supplier record.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  // --- Filtering & Sorting ---

  applyFilters(): void {
    let filteredData = [...this.allSuppliers];

    // Filter by name
    if (this.filterName) {
      const nameLower = this.filterName.toLowerCase();
      filteredData = filteredData.filter(record =>
        record.name.toLowerCase().includes(nameLower)
      );
    }

    // Filter by contact info
    if (this.filterContactInfo) {
       const contactLower = this.filterContactInfo.toLowerCase();
      filteredData = filteredData.filter(record =>
        record.contactInfo.toLowerCase().includes(contactLower)
      );
    }

     // Filter by services offered
    if (this.filterServices) {
       const servicesLower = this.filterServices.toLowerCase();
      filteredData = filteredData.filter(record =>
        record.servicesOffered.toLowerCase().includes(servicesLower)
      );
    }

    // Sort by name
    filteredData.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return this.sortNameAsc ? comparison : -comparison;
    });


    // Update the MatTableDataSource
    this.dataSource.data = filteredData;

    // Reset paginator if using
    // if (this.dataSource.paginator) {
    //   this.dataSource.paginator.firstPage();
    // }

    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.filterName = '';
    this.filterContactInfo = '';
    this.filterServices = '';
    this.sortNameAsc = true; // Reset sort
    this.applyFilters();
  }

  toggleNameSort(): void {
    this.sortNameAsc = !this.sortNameAsc;
    this.applyFilters(); // Re-apply filters to sort
  }

  // --- UI Helpers ---

  // Helper for notifications
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'], // Use array
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  // --- Clear Filter Methods ---
  clearFilterName(): void { this.filterName = ''; this.applyFilters(); }
  clearFilterContactInfo(): void { this.filterContactInfo = ''; this.applyFilters(); }
  clearFilterServices(): void { this.filterServices = ''; this.applyFilters(); }

  // --- Calculated Stats Getters ---
  get totalRecordsCount(): number {
    return this.allSuppliers.length;
  }

   get displayedCount(): number {
       return this.dataSource.data.length;
   }

}