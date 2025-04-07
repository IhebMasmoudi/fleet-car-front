import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UserService } from 'src/app/services/UserService.service';
import { IUser } from 'src/app/interfaces/IUser';
import { IRole } from 'src/app/interfaces/IRole';
import { RoleService } from 'src/app/services/RoleService.Service';
import { AuthService } from 'src/app/services/AuthService.Service';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Ensure FormsModule is imported
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon'; // Ensure MatIconModule is imported

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [
     // Ensure all necessary modules are listed here for standalone component
     CommonModule,
     FormsModule,
     MatTableModule,
     MatCardModule,
     MatFormFieldModule,
     MatInputModule,
     MatButtonModule,
     MatSelectModule,
     MatIconModule
  ],
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['photo', 'username', 'email', 'role', 'actions'];
  dataSource = new MatTableDataSource<IUser>([]);
  errorMessage: string = '';
  successMessage: string = '';

  showForm: boolean = false;
  isEditMode: boolean = false;

  // Model for the user form
  userForm: {
    id?: number;
    username: string;
    email: string;
    password?: string; // Optional in the form model
    roleId?: number;
  } = {
    username: '',
    email: '',
    password: '', // Initialize as empty
    roleId: undefined,
  };

  roles: IRole[] = [];

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.refreshUsers(); // Initial data load
    this.fetchRoles();
  }

  /** Helper to refresh user list and clear messages */
  private refreshUsers(): void {
      this.errorMessage = '';
      this.successMessage = '';
      this.fetchUsers();
  }

  /** Retrieves all users from the backend. */
  fetchUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: IUser[]) => {
        this.dataSource.data = users.map(user => ({
          ...user,
          photo: this.getRandomPhoto() // Add photo property client-side
        }));
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.errorMessage = 'Error fetching users. Please try again later.';
        this.successMessage = '';
      },
    });
  }

  /** Retrieves all roles from the backend. */
  fetchRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles: IRole[]) => {
        this.roles = roles;
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
        this.errorMessage = 'Error fetching roles. Please try again later.';
        this.successMessage = '';
      },
    });
  }

  /** Opens the form for adding a new user. */
  openAddUserForm(): void {
    this.isEditMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.userForm = { // Reset form
      username: '',
      email: '',
      password: '',
      roleId: undefined,
    };
    this.showForm = true;
  }

  /** Opens the form for editing an existing user. */
  openEditUserForm(user: IUser): void {
    this.isEditMode = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.userForm = { // Populate form with user data
      id: user.id,
      username: user.username,
      email: user.email,
      password: '', // Leave password blank for update unless user types a new one
      roleId: user.roleId,
    };
    this.showForm = true;
  }

  /** Saves the user (Update or Add). */
  saveUser(): void {
    this.errorMessage = ''; // Clear messages on save attempt
    this.successMessage = '';

    if (this.isEditMode) {
      // --- UPDATE USER ---
      if (!this.userForm.id) {
        this.errorMessage = 'Cannot update user without an ID.';
        return;
      }

      // Pass the password value directly from the form model.
      // If the user didn't type anything, this will be "" (empty string).
      const passwordToSend = this.userForm.password;

      // DEBUG LOG: Check data being sent from component
      console.log(`DEBUG [UsersComponent]: Calling updateUser service with ID: ${this.userForm.id}, Username: ${this.userForm.username}, Password: '${passwordToSend}', Email: ${this.userForm.email}, RoleID: ${this.userForm.roleId}`);

      this.userService.updateUser(
          this.userForm.id,
          this.userForm.username,
          passwordToSend, // Pass form value (could be "" or a new password)
          this.userForm.email,
          this.userForm.roleId
        )
        .subscribe({
          // Handle the Observable<IUser | null> response
          next: (updatedUser: IUser | null) => {
            if (updatedUser) {
              // Case 1: Backend returned valid JSON, update successful
              console.log('User updated successfully (received data):', updatedUser);
              this.successMessage = `User '${updatedUser.username}' updated successfully.`;
            } else {
              // Case 2: Service returned null (due to 200 OK + Parse Error bypass)
              console.log('User update request successful (HTTP 200 OK), but no user data returned from backend.');
              this.successMessage = `User '${this.userForm.username}' update accepted by server.`;
            }
            this.refreshUsers(); // Refresh the user list
            this.closeUserForm(); // Close the form
          },
          error: (err: HttpErrorResponse) => { // Type error for better property access
            console.error('Error updating user:', err);
            // Provide more specific error feedback
             let detail = err.message || 'Update failed. Please check details and try again.';
             if (err.error && typeof err.error === 'object' && err.error.message) {
                detail = err.error.message; // Use structured error message if backend provides it
             } else if (err.error && typeof err.error === 'string') {
                // Attempt to parse if it looks like JSON, otherwise use raw string
                try {
                   const errorObj = JSON.parse(err.error);
                   detail = errorObj.message || errorObj.error || err.error;
                } catch(e) {
                   detail += ` Server detail: ${err.error}`; // Append raw string error if not JSON
                }
             }
            this.errorMessage = `Error updating user: ${detail}`;
          },
        });

    } else {
      // --- ADD USER (Registration) ---
      if (!this.userForm.password?.trim()) {
          this.errorMessage = "Password is required to register a new user.";
          return;
      }
      // Ensure roleId has a default if needed by your backend logic
      const roleIdToSend = this.userForm.roleId ?? 0; // Example: default to 0 if undefined

      this.authService.register(
          this.userForm.username,
          this.userForm.password, // Password is required for registration
          this.userForm.email,
          roleIdToSend
        )
        .subscribe({
          next: (newUser: IUser) => {
            console.log('User registered successfully:', newUser);
            this.successMessage = `User '${newUser.username}' registered successfully.`;
            this.refreshUsers();
            this.closeUserForm();
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error registering user:', err);
            let detail = err.message || 'Registration failed. Please check details.';
             if (err.error && typeof err.error === 'object' && err.error.message) {
                detail = err.error.message;
             } else if (err.error && typeof err.error === 'string') {
                try {
                   const errorObj = JSON.parse(err.error);
                   detail = errorObj.message || errorObj.error || err.error;
                } catch(e) {
                   detail += ` Server detail: ${err.error}`;
                }
             }
            this.errorMessage = `Error registering user: ${detail}`;
          },
        });
    }
  }

  /** Deletes the user with the given ID. */
  deleteUser(user: IUser | undefined): void { // Pass user object for better feedback
    if (!user || user.id === undefined) {
        console.warn("Delete called without a valid user or user ID.");
        return;
    };

    this.errorMessage = ''; // Clear messages
    this.successMessage = '';

    // Optional: Add a confirmation dialog here
    // if (!confirm(`Are you sure you want to delete user '${user.username}'?`)) {
    //   return;
    // }

    this.userService.deleteUser(user.id).subscribe({
      // Handle the Observable<string | null> response
      next: (response: string | null) => {
        if (response !== null) {
          // Case 1: Backend returned a valid string response
           console.log('User deleted successfully (with response):', response);
           this.successMessage = `User '${user.username}' deleted. Server response: ${response}`;
        } else {
           // Case 2: Service returned null (due to 200/204 OK + Parse Error bypass)
           console.log(`Delete request for user '${user.username}' successful (HTTP OK).`);
           this.successMessage = `User '${user.username}' deleted successfully.`;
        }
        this.refreshUsers(); // Refresh list after successful delete
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error deleting user:', err);
         let detail = err.message || 'Delete failed. Please try again.';
         if (err.error && typeof err.error === 'object' && err.error.message) {
            detail = err.error.message;
         } else if (err.error && typeof err.error === 'string') {
            try {
               const errorObj = JSON.parse(err.error);
               detail = errorObj.message || errorObj.error || err.error;
            } catch(e) {
               detail += ` Server detail: ${err.error}`;
            }
         }
        this.errorMessage = `Error deleting user '${user.username}': ${detail}`;
      },
    });
  }

  /** Closes the form view and shows the table. */
  closeUserForm(): void {
    this.showForm = false;
  }

  /** Optional: Handle role selection changes. */
  changing(event: any): void {
    console.log('Role selection changed:', event.value);
    // No action needed here usually unless you have dependent logic
  }

  /** Gets a random placeholder photo URL. */
  getRandomPhoto(): string {
    // Simple placeholder logic
    const randomIndex = Math.floor(Math.random() * 10) + 1;
    return `assets/images/profile/user-${randomIndex}.jpg`; // Ensure path is correct
  }

  /** Gets the role name from the role ID for display purposes. */
  getRoleName(roleId: number | undefined): string {
      if (roleId === undefined || roleId === null) return 'N/A';
      const role = this.roles.find(r => r.id === roleId);
      return role ? role.name : 'Unknown Role'; // Handle case where role might not be found
  }
}