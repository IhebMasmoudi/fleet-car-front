import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../services/RoleService.Service';
import { IRole } from '../../interfaces/IRole';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    CommonModule,
    MatIconModule,
    MatMenuModule
  ],
})
export class RolesComponent implements OnInit {
  roles: IRole[] = [];
  displayedColumns: string[] = ['id', 'name', 'actions'];
  newRole: IRole = { id: undefined, name: '' }; // For adding a new role
  editedRole: IRole = { id: undefined, name: '' }; // For editing an existing role
  isEditing = false; // Flag for edit mode
  showForm = false;  // Flag to control form visibility

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.fetchRoles();
  }

  /**
   * Fetch all roles from the server.
   */
  fetchRoles(): void {
    this.roleService.getAllRoles().subscribe(
      (roles) => {
        this.roles = roles;
      },
      (error) => {
        console.error('Error fetching roles:', error);
      }
    );
  }

  /**
   * Open the form in "add" mode.
   */
  openAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.newRole = { id: undefined, name: '' };
  }

  /**
   * Open the form in "edit" mode for the selected role.
   * @param role The role to edit.
   */
  startEdit(role: IRole): void {
    this.editedRole = { ...role };
    this.isEditing = true;
    this.showForm = true;
  }

  /**
   * Add a new role.
   */
  addRole(): void {
    if (!this.newRole.name.trim()) return;

    this.roleService.createRole({ id: undefined, name: this.newRole.name }).subscribe(
      (role) => {
        this.roles.push(role);
        this.newRole.name = '';
        alert('Role added successfully!');
        this.closeForm();
      },
      (error) => {
        console.error('Error adding role:', error);
        alert('Failed to add role.');
      }
    );
  }

  /**
   * Save the edited role.
   */
  saveEditedRole(): void {
    if (!this.editedRole.name.trim()) return;

    this.roleService.updateRole(this.editedRole.id!, this.editedRole).subscribe(
      () => {
        const index = this.roles.findIndex((role) => role.id === this.editedRole.id);
        if (index !== -1) {
          this.roles[index] = this.editedRole;
        }
        alert('Role updated successfully!');
        this.closeForm();
      },
      (error) => {
        console.error('Error updating role:', error);
        alert('Failed to update role.');
      }
    );
  }

  /**
   * Cancel the current form action.
   */
  cancelEdit(): void {
    this.closeForm();
  }

  /**
   * Delete a role by ID.
   * @param id The ID of the role to delete.
   */
  deleteRole(id: number): void {
    if (!confirm('Are you sure you want to delete this role?')) return;

    this.roleService.deleteRole(id).subscribe(
      () => {
        this.roles = this.roles.filter((role) => role.id !== id);
        alert('Role deleted successfully!');
      },
      (error) => {
        console.error('Error deleting role:', error);
        alert('Failed to delete role.');
      }
    );
  }

  /**
   * Hide the form and display the table.
   */
  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
  }
}
