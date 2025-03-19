import { Component, OnInit } from '@angular/core';
import { ISupplier } from '../../interfaces/ISupplier';
import { SuppliersService } from '../../services/Supplier.Service';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent implements OnInit {
  suppliers: ISupplier[] = [];
  errorMessage: string = '';
  showAddForm: boolean = false;
  isEditing: boolean = false;
  filtersExpanded: boolean = false; // Added for filter section collapse

  // Form data
  supplierForm: ISupplier = this.initSupplierForm();

  // Filter properties
  filterName: string = '';
  filterContactInfo: string = '';
  filterServices: string = '';
  sortNameAsc: boolean = true;

  displayedColumns: string[] = ['id', 'name', 'contactInfo', 'servicesOffered', 'actions'];

  constructor(private suppliersService: SuppliersService) {}

  ngOnInit(): void {
    this.fetchSuppliers();
  }

  private initSupplierForm(): ISupplier {
    return {
      name: '',
      contactInfo: '',
      servicesOffered: ''
    };
  }

  private fetchSuppliers(): void {
    this.suppliersService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error fetching suppliers:', error);
        this.errorMessage = 'Error fetching suppliers.';
      }
    });
  }

  openAddForm(): void {
    this.supplierForm = this.initSupplierForm();
    this.showAddForm = true;
    this.isEditing = false;
  }

  startEdit(supplier: ISupplier): void {
    this.supplierForm = { ...supplier };
    this.isEditing = true;
    this.showAddForm = true; // Keep form visible for editing
  }

  addSupplier(): void {
    if (!this.isValidForm()) {
      alert('Please fill out all fields.');
      return;
    }

    this.suppliersService.createSupplier(this.supplierForm).subscribe({
      next: (supplier) => {
        this.suppliers.push(supplier);
        this.closeForm();
        this.applyFilters();
        alert('Supplier added successfully!');
      },
      error: (error) => {
        console.error('Error adding supplier:', error);
        alert('Failed to add supplier.');
      }
    });
  }

  saveEditedSupplier(): void {
    if (!this.isValidForm() || !this.supplierForm.id) {
      alert('Please fill out all fields.');
      return;
    }

    this.suppliersService.updateSupplier(this.supplierForm.id, this.supplierForm).subscribe({
      next: (updatedSupplier) => {
        const index = this.suppliers.findIndex(s => s.id === updatedSupplier.id);
        if (index !== -1) {
          this.suppliers[index] = updatedSupplier;
          this.applyFilters();
        }
        this.closeForm();
        alert('Supplier updated successfully!');
      },
      error: (error) => {
        console.error('Error updating supplier:', error);
        alert('Failed to update supplier.');
      }
    });
  }

  deleteSupplier(id: number): void {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    this.suppliersService.deleteSupplier(id).subscribe({
      next: () => {
        this.suppliers = this.suppliers.filter(s => s.id !== id);
        this.applyFilters();
        alert('Supplier deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting supplier:', error);
        alert('Failed to delete supplier.');
      }
    });
  }

  closeForm(): void {
    this.showAddForm = false;
    this.isEditing = false;
    this.supplierForm = this.initSupplierForm();
  }

  private isValidForm(): boolean {
    return !!(this.supplierForm.name.trim() &&
              this.supplierForm.contactInfo.trim() &&
              this.supplierForm.servicesOffered.trim());
  }

  applyFilters(): void {
    let filteredData = [...this.suppliers];

    // Filter by name
    if (this.filterName) {
      filteredData = filteredData.filter(supplier =>
        supplier.name.toLowerCase().includes(this.filterName.toLowerCase())
      );
    }

    // Filter by contact info
    if (this.filterContactInfo) {
      filteredData = filteredData.filter(supplier =>
        supplier.contactInfo.toLowerCase().includes(this.filterContactInfo.toLowerCase())
      );
    }

    // Filter by services offered
    if (this.filterServices) {
      filteredData = filteredData.filter(supplier =>
        supplier.servicesOffered.toLowerCase().includes(this.filterServices.toLowerCase())
      );
    }

    // Sort by name
    filteredData.sort((a, b) =>
      this.sortNameAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

    this.suppliers = filteredData;
  }

  resetFilters(): void {
    this.filterName = '';
    this.filterContactInfo = '';
    this.filterServices = '';
    this.fetchSuppliers();
  }

  toggleNameSort(): void {
    this.sortNameAsc = !this.sortNameAsc;
    this.applyFilters();
  }
}