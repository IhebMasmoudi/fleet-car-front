import { Component, OnInit } from '@angular/core';
import { ISupplier } from '../../interfaces/ISupplier';
import { SuppliersService } from '../../services/Supplier.Service';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormField } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-supplier',
  imports: [
    MatTableModule,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatFormField,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    MatSelectModule
  ],
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent implements OnInit {
  suppliers: ISupplier[] = [];
  errorMessage: string = '';
  showAddForm: boolean = false;
  isEditing: boolean = false; // Flag to indicate if we're in edit mode
  newSupplier: ISupplier = {
    name: '',
    contactInfo: '',
    servicesOffered: ''
  };
  editedSupplier: ISupplier // Store the supplier being edited

  constructor(private suppliersService: SuppliersService) {}

  ngOnInit(): void {
    this.fetchSuppliers();
  }

  /**
   * Fetch all suppliers from the server.
   */
  fetchSuppliers(): void {
    this.suppliersService.getAllSuppliers().subscribe(
      (suppliers) => {
        this.suppliers = suppliers;
      },
      (error) => {
        console.error('Error fetching suppliers:', error);
        this.errorMessage = 'Error fetching suppliers.';
      }
    );
  }

  /**
   * Toggle the visibility of the Add Supplier form.
   */
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetNewSupplierForm();
    }
  }

  /**
   * Reset the new supplier form fields.
   */
  resetNewSupplierForm(): void {
    this.newSupplier = {
      name: '',
      contactInfo: '',
      servicesOffered: ''
    };
  }

  /**
   * Add a new supplier.
   */
  addSupplier(): void {
    if (!this.newSupplier.name.trim() || !this.newSupplier.contactInfo.trim() || !this.newSupplier.servicesOffered.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    this.suppliersService.createSupplier(this.newSupplier).subscribe(
      (supplier) => {
        this.suppliers.push(supplier);
        this.toggleAddForm();
        this.fetchSuppliers(); // Refresh the data
        alert('Supplier added successfully!');
      },
      (error) => {
        console.error('Error adding supplier:', error);
        alert('Failed to add supplier.');
      }
    );
  }

  /**
   * Start editing a supplier.
   * @param supplier The supplier to edit.
   */
  startEdit(supplier: ISupplier): void {
    this.isEditing = true;
    this.editedSupplier = { ...supplier }; // Clone the supplier to avoid direct modification
    this.showAddForm = false; // Hide the "Add Supplier" form if it's open
  }

  /**
   * Save the edited supplier.
   */
  saveEditedSupplier(): void {
    if (!this.editedSupplier) return;

    // Ensure that the edited supplier's values are not null
    const updatedSupplier: ISupplier = {
      id: this.editedSupplier.id,
      name: this.editedSupplier.name.trim() || this.suppliers.find(s => s.id === this.editedSupplier?.id)?.name || '',
      contactInfo: this.editedSupplier.contactInfo.trim() || this.suppliers.find(s => s.id === this.editedSupplier?.id)?.contactInfo || '',
      servicesOffered: this.editedSupplier.servicesOffered.trim() || this.suppliers.find(s => s.id === this.editedSupplier?.id)?.servicesOffered || ''
    };

    if (!updatedSupplier.name || !updatedSupplier.contactInfo || !updatedSupplier.servicesOffered) {
      alert('Please fill out all fields.');
      return;
    }

    this.suppliersService.updateSupplier(updatedSupplier.id!, updatedSupplier).subscribe(
      (updatedSupplier) => {
        // Update the supplier in the local list
        const index = this.suppliers.findIndex((s) => s.id === updatedSupplier.id);
        if (index !== -1) {
          this.suppliers[index] = updatedSupplier;
        }
        this.cancelEdit(); // Close the edit form
        this.fetchSuppliers(); // Refresh the data
        alert('Supplier updated successfully!');
      },
      (error) => {
        console.error('Error updating supplier:', error);
        alert('Failed to update supplier.');
      }
    );
  }

  /**
   * Cancel editing and reset the form.
   */
  cancelEdit(): void {
    this.isEditing = false;
  }

  /**
   * Delete a supplier by ID.
   * @param id The ID of the supplier to delete.
   */
  deleteSupplier(id: number): void {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    this.suppliersService.deleteSupplier(id).subscribe(
      () => {
        this.suppliers = this.suppliers.filter((s) => s.id !== id);
        this.fetchSuppliers(); // Refresh the data
        alert('Supplier deleted successfully!');
      },
      (error) => {
        console.error('Error deleting supplier:', error);
        alert('Failed to delete supplier.');
      }
    );
  }
}