import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IInvoice } from 'src/app/interfaces/IInvoice';
import { InvoiceService } from 'src/app/services/Invoice.service';
import { SuppliersService } from 'src/app/services/Supplier.Service';
import { CarsService } from 'src/app/services/Cars.service';
import { ISupplier } from 'src/app/interfaces/ISupplier';
import { ICars } from 'src/app/interfaces/ICars';
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
import { MatDialog } from '@angular/material/dialog';
import { CarDetailsDialogComponent } from 'src/app/pages/invoice/CarDetailsDialog.Component';
import { SupplierDetailsDialogComponent } from 'src/app/pages/invoice/SupplierDetailsDialog.Component';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
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
  ],
  providers: [DatePipe]
})
export class InvoiceComponent implements OnInit {
  invoices: IInvoice[] = [];
  suppliers: ISupplier[] = [];
  cars: ICars[] = [];
  errorMessage: string = '';

  showAddForm: boolean = false;
  isEditing: boolean = false;
  selectedInvoice: IInvoice | null = null;

  invoiceIssueDate: Date | null = null;
  invoiceDueDate: Date | null = null;
  invoiceAmount: number = 0;
  invoiceStatus: string = '';
  invoiceSupplierID: number | null = null;
  invoiceVehicleID: number | null = null;

  filterStatus: string = '';
  searchTerm: string = '';

  displayedColumns: string[] = ['issueDate', 'dueDate', 'amount', 'status', 'supplier', 'vehicle', 'actions'];
  dataSource = new MatTableDataSource<IInvoice>(this.invoices);
  filteredDataSource = new MatTableDataSource<IInvoice>(this.invoices);

  constructor(
    private invoiceService: InvoiceService,
    private suppliersService: SuppliersService,
    private carsService: CarsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchInvoices();
    this.fetchSuppliers();
    this.fetchCars();
  }

  fetchInvoices(): void {
    this.invoiceService.getAllInvoices().subscribe(
      (records) => {
        this.invoices = records;
        this.dataSource.data = this.invoices;
        this.filteredDataSource.data = this.invoices;
        console.log('Fetched invoices:', records);
      },
      (error) => {
        console.error('Error fetching invoices:', error);
        this.errorMessage = 'Error fetching invoice records.';
      }
    );
  }

  fetchSuppliers(): void {
    this.suppliersService.getAllSuppliers().subscribe(
      (suppliers) => {
        this.suppliers = suppliers;
        console.log('Fetched suppliers:', suppliers);
      },
      (error) => {
        console.error('Error fetching suppliers:', error);
      }
    );
  }

  fetchCars(): void {
    this.carsService.getAllVehicles().subscribe(
      (cars) => {
        this.cars = cars;
        console.log('Fetched vehicles:', cars);
      },
      (error) => {
        console.error('Error fetching vehicles:', error);
      }
    );
  }

  applyFilters(): void {
    const filteredInvoices = this.invoices.filter(invoice => {
      const matchesStatus = this.filterStatus ? invoice.status === this.filterStatus : true;
      const matchesSearch = invoice.supplierID.toString().includes(this.searchTerm) || 
                            invoice.vehicleID.toString().includes(this.searchTerm);
      return matchesStatus && matchesSearch;
    });
    this.filteredDataSource.data = filteredInvoices;
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedInvoice = null;
    this.invoiceIssueDate = null;
    this.invoiceDueDate = null;
    this.invoiceAmount = 0;
    this.invoiceStatus = '';
    this.invoiceSupplierID = null;
    this.invoiceVehicleID = null;
  }

  addInvoice(): void {
    if (!this.invoiceIssueDate || !this.invoiceDueDate || !this.invoiceAmount ||
        !this.invoiceStatus || !this.invoiceSupplierID || !this.invoiceVehicleID) {
      alert('Please fill in all required fields.');
      return;
    }

    const newInvoice: IInvoice = {
      issueDate: this.invoiceIssueDate,
      dueDate: this.invoiceDueDate,
      amount: this.invoiceAmount,
      status: this.invoiceStatus,
      supplierID: this.invoiceSupplierID,
      vehicleID: this.invoiceVehicleID
    };

    this.invoiceService.createInvoice(newInvoice).subscribe(
      (record) => {
        this.invoices.push(record);
        this.dataSource.data = this.invoices;
        this.filteredDataSource.data = this.invoices;
        this.resetForm();
        this.showAddForm = false;
        alert('Invoice added successfully!');
      },
      (error) => {
        console.error('Error adding invoice:', error);
        alert('Failed to add invoice.');
      }
    );
  }

  startEdit(invoice: IInvoice): void {
    this.selectedInvoice = { ...invoice };
    this.isEditing = true;
    this.showAddForm = true;

    this.invoiceIssueDate = new Date(invoice.issueDate);
    this.invoiceDueDate = new Date(invoice.dueDate);
    this.invoiceAmount = invoice.amount;
    this.invoiceStatus = invoice.status;
    this.invoiceSupplierID = invoice.supplierID;
    this.invoiceVehicleID = invoice.vehicleID;
  }

  saveEditedInvoice(): void {
    if (!this.selectedInvoice) return;
    if (!this.invoiceIssueDate || !this.invoiceDueDate || !this.invoiceAmount ||
        !this.invoiceStatus || !this.invoiceSupplierID || !this.invoiceVehicleID) {
      alert('Please fill in all required fields.');
      return;
    }

    const updatedInvoice: IInvoice = {
      ...this.selectedInvoice,
      issueDate: this.invoiceIssueDate,
      dueDate: this.invoiceDueDate,
      amount: this.invoiceAmount,
      status: this.invoiceStatus,
      supplierID: this.invoiceSupplierID,
      vehicleID: this.invoiceVehicleID
    };

    this.invoiceService.updateInvoice(this.selectedInvoice.id!, updatedInvoice).subscribe(
      () => {
        const index = this.invoices.findIndex(inv => inv.id === this.selectedInvoice!.id);
        if (index !== -1) {
          this.invoices[index] = updatedInvoice;
          this.dataSource.data = this.invoices;
          this.filteredDataSource.data = this.invoices;
        }
        this.cancelEdit();
        alert('Invoice updated successfully!');
      },
      (error) => {
        console.error('Error updating invoice:', error);
        alert('Failed to update invoice.');
      }
    );
  }

  cancelEdit(): void {
    this.resetForm();
    this.showAddForm = false;
  }

  deleteInvoice(id: number): void {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    this.invoiceService.deleteInvoice(id).subscribe(
      () => {
        this.invoices = this.invoices.filter(inv => inv.id !== id);
        this.dataSource.data = this.invoices;
        this.filteredDataSource.data = this.invoices;
        alert('Invoice deleted successfully!');
      },
      (error) => {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice.');
      }
    );
  }

  // Helper to display supplier name
  getSupplierName(supplierID: number): string {
    const supplier = this.suppliers.find(s => s.id === supplierID);
    return supplier ? supplier.name : 'Unknown';
  }

  // Helper to display vehicle model
  getVehicleModel(vehicleID: number): string {
    const car = this.cars.find(c => c.id === vehicleID);
    return car ? car.model : 'Unknown';
  }

  // Open a dialog to show car details
  openCarDetails(vehicleID: number): void {
    const car = this.cars.find(c => c.id === vehicleID);
    if (!car) return;
    this.dialog.open(CarDetailsDialogComponent, {
      width: '400px',
      data: car
    });
  }

  // Open a dialog to show supplier details
  openSupplierDetails(supplierID: number): void {
    const supplier = this.suppliers.find(s => s.id === supplierID);
    if (!supplier) return;
    this.dialog.open(SupplierDetailsDialogComponent, {
      width: '400px',
      data: supplier
    });
  }

  // Print invoice details in a new window
  printInvoice(invoice: IInvoice): void {
    const supplierName = this.getSupplierName(invoice.supplierID);
    const carModel = this.getVehicleModel(invoice.vehicleID);
    const printContent = `
      <html>
        <head>
          <title>Invoice #${invoice.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice { max-width: 600px; margin: auto; }
            h1 { text-align: center; }
            .details { margin-top: 20px; }
            .details p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <h1>Invoice #${invoice.id}</h1>
            <div class="details">
              <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> ${invoice.amount}</p>
              <p><strong>Status:</strong> ${invoice.status}</p>
              <p><strong>Supplier:</strong> ${supplierName}</p>
              <p><strong>Vehicle:</strong> ${carModel}</p>
            </div>
          </div>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;
    const newWin = window.open('', '_blank', 'width=800,height=600');
    newWin?.document.open();
    newWin?.document.write(printContent);
    newWin?.document.close();
  }
}