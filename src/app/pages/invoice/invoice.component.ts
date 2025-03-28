import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core'; // Added OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild
import { CommonModule, DatePipe } from '@angular/common'; // Import CommonModule, DatePipe
import { FormsModule } from '@angular/forms'; // Keep FormsModule for template-driven forms
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // Import Paginator if using
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core'; // Added MatNativeDateModule
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Added MatDialogModule
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Added MatProgressSpinnerModule
import { MatTooltipModule } from '@angular/material/tooltip'; // Added MatTooltipModule
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Added MatSnackBarModule

import { Subject } from 'rxjs'; // Import Subject
import { takeUntil, finalize } from 'rxjs/operators'; // Import takeUntil, finalize

import { IInvoice } from 'src/app/interfaces/IInvoice';
import { ISupplier } from 'src/app/interfaces/ISupplier';
import { ICars } from 'src/app/interfaces/ICars';
import { InvoiceService } from 'src/app/services/Invoice.service';
import { SuppliersService } from 'src/app/services/Supplier.Service';
import { CarsService } from 'src/app/services/Cars.service';

// Import Dialog Components 
import { CarDetailsDialogComponent } from 'src/app/pages/invoice/CarDetailsDialog.Component';
import { SupplierDetailsDialogComponent } from 'src/app/pages/invoice/SupplierDetailsDialog.Component';

@Component({
  selector: 'app-invoice',
  standalone: true, // Make component standalone
  imports: [
    CommonModule, // Use CommonModule for directives like *ngIf, *ngFor
    FormsModule, // Keep for template-driven form [(ngModel)]
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMenuModule,
    MatNativeDateModule,
    MatDialogModule, // Add Dialog Module
    MatProgressSpinnerModule, // Add Progress Spinner
    MatTooltipModule, // Add Tooltip Module
    MatSnackBarModule, // Add Snackbar Module
    MatPaginatorModule, // Add Paginator Module (if using)
    // Import dialog components if they are standalone
    // CarDetailsDialogComponent,
    // SupplierDetailsDialogComponent,
  ],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
  providers: [DatePipe], // Provide DatePipe if not globally provided
  changeDetection: ChangeDetectionStrategy.OnPush // Set Change Detection Strategy
})
export class InvoiceComponent implements OnInit, OnDestroy { // Implement OnDestroy

  // --- State Properties ---
  allInvoices: IInvoice[] = [];         // Master list of all fetched invoices
  suppliers: ISupplier[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;           // Loading indicator for data fetching
  loading: boolean = false;             // Loading indicator for actions (add, update, delete)
  showAddForm: boolean = false;
  isEditing: boolean = false;
  selectedInvoice: IInvoice | null = null;
  filtersExpanded: boolean = false;

  // --- Form Fields (for template-driven form) ---
  invoiceIssueDate: Date | null = null;
  invoiceDueDate: Date | null = null;
  invoiceAmount: number | null = null; // Use null initially for validation
  invoiceStatus: string = '';          // Default or validation handled by required
  invoiceSupplierID: number | null = null;
  invoiceVehicleID: number | null = null;

  // --- Filter Properties ---
  filterStatus: string = ''; // Empty means 'All'
  searchTerm: string = '';
  filterIssueDateFrom: Date | null = null;
  filterDueDateTo: Date | null = null;
  // sortAsc: boolean = true; // Add sorting state if needed

  // --- Table Properties ---
  // Use MatTableDataSource for compatibility with sorting/pagination
  dataSource = new MatTableDataSource<IInvoice>([]);
  displayedColumns: string[] = ['issueDate', 'dueDate', 'amount', 'status', 'supplier', 'vehicle', 'actions'];

  // --- Paginator ---
  // @ViewChild(MatPaginator) paginator!: MatPaginator; // Uncomment if using paginator

  // --- RxJS Subject for Unsubscribing ---
  private destroy$ = new Subject<void>();

  constructor(
    private invoiceService: InvoiceService,
    private suppliersService: SuppliersService,
    private carsService: CarsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar, // Inject MatSnackBar
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private datePipe: DatePipe // Inject DatePipe
  ) {}

  // --- Lifecycle Hooks ---

  ngOnInit(): void {
    // Fetch initial data
    this.fetchSuppliers(); // Fetch lookups first or concurrently
    this.fetchCars();
    this.fetchInvoices();
  }

  // ngAfterViewInit(): void { // Uncomment if using paginator
  //   this.dataSource.paginator = this.paginator;
  // }

  ngOnDestroy(): void {
    // Complete the subject to automatically unsubscribe
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Fetching ---

  fetchInvoices(): void {
    this.isLoading = true; // Start loading indicator
    this.errorMessage = ''; // Clear previous errors
    this.cdr.markForCheck();

    this.invoiceService.getAllInvoices()
      .pipe(
        takeUntil(this.destroy$), // Auto-unsubscribe
        finalize(() => {
            this.isLoading = false; // Stop loading indicator
            this.cdr.markForCheck(); // Trigger change detection
        })
      )
      .subscribe({
        next: (records) => {
          this.allInvoices = records; // Store the full list
          this.applyFilters(); // Apply filters to populate dataSource
          console.log('Fetched invoices:', records);
          this.cdr.markForCheck(); // Trigger change detection
        },
        error: (error) => {
          console.error('Error fetching invoices:', error);
          this.errorMessage = 'Error fetching invoice records.';
          this.allInvoices = []; // Clear data on error
          this.applyFilters(); // Update table with empty data
          this.cdr.markForCheck(); // Trigger change detection
        }
      });
  }

  fetchSuppliers(): void {
    // No loading indicator needed usually for lookups unless slow
    this.suppliersService.getAllSuppliers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suppliers) => {
          this.suppliers = suppliers;
          console.log('Fetched suppliers:', suppliers);
          this.cdr.markForCheck(); // Update if supplier list affects template immediately
        },
        error: (error) => {
          console.error('Error fetching suppliers:', error);
          // Show error notification if critical
          // this.showNotification('Failed to load suppliers list.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  fetchCars(): void {
    // No loading indicator needed usually for lookups unless slow
    this.carsService.getAllVehicles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cars) => {
          this.cars = cars;
          console.log('Fetched vehicles:', cars);
          this.cdr.markForCheck(); // Update if car list affects template immediately
        },
        error: (error) => {
          console.error('Error fetching vehicles:', error);
           // Show error notification if critical
          // this.showNotification('Failed to load vehicles list.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  // --- Filtering & Sorting ---

  applyFilters(): void {
    // Start with the master list
    let filteredData = [...this.allInvoices];

    // Filter by status
    if (this.filterStatus) {
      filteredData = filteredData.filter(invoice => invoice.status === this.filterStatus);
    }

    // Filter by search term (Supplier Name or Vehicle Model/Plate)
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filteredData = filteredData.filter(invoice =>
        this.getSupplierName(invoice.supplierID).toLowerCase().includes(searchTermLower) ||
        this.getVehicleModelAndPlate(invoice.vehicleID).toLowerCase().includes(searchTermLower) // Search model and plate
      );
    }

     // Filter by Issue Date From
    if (this.filterIssueDateFrom) {
      const fromDate = new Date(this.filterIssueDateFrom);
      fromDate.setHours(0, 0, 0, 0); // Normalize to start of day
      filteredData = filteredData.filter(invoice => new Date(invoice.issueDate) >= fromDate);
    }

    // Filter by Due Date To
    if (this.filterDueDateTo) {
      const toDate = new Date(this.filterDueDateTo);
      toDate.setHours(23, 59, 59, 999); // Normalize to end of day
      filteredData = filteredData.filter(invoice => new Date(invoice.dueDate) <= toDate);
    }

    // Update the MatTableDataSource
    this.dataSource.data = filteredData;

    this.cdr.markForCheck(); // Notify Angular
  }

  resetFilters(): void {
    // Reset filter properties
    this.filterStatus = '';
    this.searchTerm = '';
    this.filterIssueDateFrom = null;
    this.filterDueDateTo = null;
    // this.sortAsc = true; // Reset sort direction if implemented
    // Re-apply filters with empty values
    this.applyFilters();
  }

  // --- Form Handling & CRUD ---

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm(); // Clear form when closing
    } else {
        this.isEditing = false; // Ensure not in edit mode when opening fresh
        this.resetForm(); // Clear any previous edit state
    }
    this.cdr.markForCheck();
  }

  resetForm(): void {
    // Clear form model properties
    this.invoiceIssueDate = null;
    this.invoiceDueDate = null;
    this.invoiceAmount = null;
    this.invoiceStatus = '';
    this.invoiceSupplierID = null;
    this.invoiceVehicleID = null;
    // Reset editing state
    this.isEditing = false;
    this.selectedInvoice = null;
    // We don't reset showAddForm here, it's controlled by toggleAddForm/cancelEdit
    this.cdr.markForCheck(); // May need check if reset affects template directly
  }

   submitInvoiceForm(): void {
      // Central submit, validation done via template #invoiceForm.invalid
      if (this.isEditing) {
          this.saveEditedInvoice();
      } else {
          this.addInvoice();
      }
  }

  addInvoice(): void {
    // Validation is checked by the form's [disabled] binding
    // Ensure required fields are not null/empty (though template validation should prevent submission)
     if (!this.invoiceIssueDate || !this.invoiceDueDate || this.invoiceAmount === null || this.invoiceAmount < 0 ||
        !this.invoiceStatus || !this.invoiceSupplierID || !this.invoiceVehicleID) {
        this.showNotification('Please fill in all required fields correctly.', 'error');
        // Consider marking fields as touched manually if needed, though template should handle it
        return;
    }


    this.loading = true; // Indicate loading state
    this.cdr.markForCheck();

    // Create the new invoice object - Ensure dates are formatted correctly if backend expects strings
    const newInvoice: IInvoice = {
      // id is generated by backend
      issueDate: this.invoiceIssueDate as Date, // Ensure it's a Date
      dueDate: this.invoiceDueDate as Date,     // Ensure it's a Date
      amount: this.invoiceAmount,
      status: this.invoiceStatus,
      supplierID: this.invoiceSupplierID,
      vehicleID: this.invoiceVehicleID
    };

    this.invoiceService.createInvoice(newInvoice)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false; // Reset loading state
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (record) => {
                this.allInvoices.push(record); // Add to master list
                this.applyFilters();          // Update table data
                this.showAddForm = false;     // Close form
                this.resetForm();             // Clear form fields
                this.showNotification('Invoice added successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error adding invoice:', error);
                this.showNotification('Failed to add invoice. Please try again.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

  startEdit(invoice: IInvoice): void {
    this.selectedInvoice = { ...invoice }; // Store the original invoice being edited
    this.isEditing = true;

    // Populate form fields with data from the selected invoice
    // Ensure dates are converted to Date objects for the date pickers
    this.invoiceIssueDate = new Date(invoice.issueDate);
    this.invoiceDueDate = new Date(invoice.dueDate);
    this.invoiceAmount = invoice.amount;
    this.invoiceStatus = invoice.status;
    this.invoiceSupplierID = invoice.supplierID;
    this.invoiceVehicleID = invoice.vehicleID;

    this.showAddForm = true; // Show the form
    this.cdr.markForCheck();
  }

  saveEditedInvoice(): void {
    // Basic validation check (template form handles detailed validation)
    if (!this.selectedInvoice || !this.selectedInvoice.id || !this.invoiceIssueDate || !this.invoiceDueDate ||
        this.invoiceAmount === null || this.invoiceAmount < 0 || !this.invoiceStatus ||
        !this.invoiceSupplierID || !this.invoiceVehicleID) {
        this.showNotification('Please fill in all required fields correctly.', 'error');
        return;
    }

    this.loading = true; // Indicate loading state
    this.cdr.markForCheck();

    // Create the updated invoice object
    const updatedInvoice: IInvoice = {
      ...this.selectedInvoice, // Keep original ID and potentially other unchanged fields
      issueDate: this.invoiceIssueDate as Date, // Ensure it's a Date
      dueDate: this.invoiceDueDate as Date,     // Ensure it's a Date
      amount: this.invoiceAmount,
      status: this.invoiceStatus,
      supplierID: this.invoiceSupplierID,
      vehicleID: this.invoiceVehicleID
    };

    this.invoiceService.updateInvoice(this.selectedInvoice.id, updatedInvoice)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false; // Reset loading state
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: (updatedRecord) => { // Assuming backend returns the updated record
                // Find and update the invoice in the master list
                const index = this.allInvoices.findIndex(inv => inv.id === this.selectedInvoice!.id);
                if (index !== -1) {
                    this.allInvoices[index] = updatedRecord; // Use returned record
                }
                this.applyFilters();      // Update table data
                this.showAddForm = false; // Close form
                this.resetForm();         // Clear form fields and editing state
                this.showNotification('Invoice updated successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error updating invoice:', error);
                this.showNotification('Failed to update invoice. Please try again.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

  cancelEdit(): void {
    this.showAddForm = false; // Hide the form
    this.resetForm();       // Clear form fields and editing state
    this.cdr.markForCheck();
  }

  deleteInvoice(id: number | undefined): void {
    if (id === undefined) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    this.loading = true; // Use general loading flag for button disable
    this.cdr.markForCheck();

    this.invoiceService.deleteInvoice(id)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.loading = false; // Reset loading state
                this.cdr.markForCheck();
            })
        )
        .subscribe({
            next: () => {
                // Remove invoice from the master list
                this.allInvoices = this.allInvoices.filter(inv => inv.id !== id);
                this.applyFilters(); // Update table data
                this.showNotification('Invoice deleted successfully!', 'success');
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error deleting invoice:', error);
                this.showNotification('Failed to delete invoice.', 'error');
                this.cdr.markForCheck();
            }
    });
  }

  // --- UI Helpers & Actions ---

  getSupplierName(supplierID: number | null): string {
    if (supplierID === null) return 'N/A';
    const supplier = this.suppliers.find(s => s.id === supplierID);
    return supplier ? supplier.name : 'Unknown';
  }

  getVehicleModel(vehicleID: number | null): string {
    if (vehicleID === null) return 'N/A';
    const car = this.cars.find(c => c.id === vehicleID);
    return car ? `${car.brand} ${car.model}` : 'N/A'; // Simplified display
  }

   getVehicleModelAndPlate(vehicleID: number | null): string {
    if (vehicleID === null) return 'N/A';
    const car = this.cars.find(c => c.id === vehicleID);
    return car ? `${car.brand} ${car.model} (${car.licensePlate})` : 'N/A'; // For searching
  }

  openCarDetails(vehicleID: number | null): void {
    if (vehicleID === null) return;
    const car = this.cars.find(c => c.id === vehicleID);
    if (!car) {
        this.showNotification('Vehicle details not found.', 'error');
        return;
    };
    // Ensure CarDetailsDialogComponent is imported and declared/imported correctly
    this.dialog.open(CarDetailsDialogComponent, {
      width: '450px', // Adjust width as needed
      data: car
    });
  }

  openSupplierDetails(supplierID: number | null): void {
     if (supplierID === null) return;
    const supplier = this.suppliers.find(s => s.id === supplierID);
    if (!supplier) {
        this.showNotification('Supplier details not found.', 'error');
        return;
    }
    // Ensure SupplierDetailsDialogComponent is imported and declared/imported correctly
    this.dialog.open(SupplierDetailsDialogComponent, {
      width: '450px', // Adjust width as needed
      data: supplier
    });
  }

  printInvoice(invoice: IInvoice): void {
    // Keep your existing print logic, ensure helpers handle potential null IDs
    const supplierName = this.getSupplierName(invoice.supplierID);
    const carModel = this.getVehicleModel(invoice.vehicleID);
    const issueDateStr = this.datePipe.transform(invoice.issueDate, 'yyyy-MM-dd') || 'N/A';
    const dueDateStr = this.datePipe.transform(invoice.dueDate, 'yyyy-MM-dd') || 'N/A';
    const amountStr = this.datePipe.transform(invoice.amount, '1.2-2', 'TND') || 'N/A'; // Use currency pipe if available or format manually

    const printContent = `
      <html>
        <head>
          <title>Invoice #${invoice.id || 'N/A'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; line-height: 1.5; }
            .invoice-container { max-width: 700px; margin: auto; border: 1px solid #ccc; padding: 30px; border-radius: 8px; }
            h1 { text-align: center; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 25px; }
            .details-grid { display: grid; grid-template-columns: 150px 1fr; gap: 8px 15px; margin-top: 20px; }
            .details-grid strong { color: #555; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #888; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <h1>Invoice</h1>
            <div class="details-grid">
              <strong>Invoice ID:</strong>        <span>#${invoice.id || 'N/A'}</span>
              <strong>Issue Date:</strong>      <span>${issueDateStr}</span>
              <strong>Due Date:</strong>        <span>${dueDateStr}</span>
              <strong>Amount:</strong>          <span>${amountStr}</span>
              <strong>Status:</strong>          <span>${invoice.status || 'N/A'}</span>
              <strong>Supplier:</strong>        <span>${supplierName}</span>
              <strong>Vehicle:</strong>         <span>${carModel}</span>
            </div>
            <div class="footer">
              Generated on: ${new Date().toLocaleString()}
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); }, 50); // Delay print slightly
            // Optionally close after print:
            // window.onafterprint = function(){ window.close(); };
          </script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    } else {
        this.showNotification('Could not open print window. Please check pop-up blocker settings.', 'error');
    }
  }

  // Helper to format date for API (if needed)
  private formatDateForAPI(date: Date | null): Date | string {
      if (!date) return ''; // Or handle as error depending on backend
      // If backend accepts Date objects, return as is:
      // return date;
      // If backend expects 'yyyy-MM-dd' string:
      return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

   // Helper for applying status badge classes
   getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'active-badge'; // Green
      case 'pending': return 'warning-badge'; // Orange/Yellow
      case 'unpaid': return 'expired-badge'; // Red
      default: return ''; // Default neutral style
    }
  }

  // Helper to check if an invoice is overdue
  isOverdue(dueDate: Date | string, status: string): boolean {
      if (status === 'Paid' || status === 'Pending') return false; // Paid or Pending cannot be overdue visually here
      const today = new Date();
      const due = new Date(dueDate);
      today.setHours(0, 0, 0, 0); // Compare dates only
      due.setHours(0, 0, 0, 0);
      return due < today;
  }

  // Helper for notifications
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

   // --- Clear Filter Methods ---
   clearSearchTerm(): void { this.searchTerm = ''; this.applyFilters(); }
   clearIssueDateFrom(): void { this.filterIssueDateFrom = null; this.applyFilters(); }
   clearDueDateTo(): void { this.filterDueDateTo = null; this.applyFilters(); }
   // No clear for status select, just select 'All'

  // --- Calculated Stats Getters ---
  get totalInvoicesCount(): number {
    return this.allInvoices.length;
  }

  get paidInvoicesCount(): number {
    return this.allInvoices.filter(inv => inv.status === 'Paid').length;
  }

   get pendingInvoicesCount(): number {
    return this.allInvoices.filter(inv => inv.status === 'Pending').length;
  }

   get unpaidInvoicesCount(): number {
    return this.allInvoices.filter(inv => inv.status === 'Unpaid').length;
  }

  get totalAmount(): number {
    // Calculate sum from the master list (or filtered list if preferred)
    return this.allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }

}