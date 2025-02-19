import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UserService } from 'src/app/services/UserService.service';
import { IUser } from 'src/app/interfaces/IUser';
import { IRole } from 'src/app/interfaces/IRole';
import { RoleService } from 'src/app/services/RoleService.Service';
import { AuthService } from 'src/app/services/AuthService.Service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [
     MatTableModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, 
     MatSelectModule, FormsModule, CommonModule, MatIconModule
  ],
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['photo', 'username', 'email', 'role', 'actions'];
  dataSource = new MatTableDataSource<IUser>([]);
  errorMessage: string = '';

  // Control whether to show the table or the form
  showForm: boolean = false;
  isEditMode: boolean = false;

  // Model for the user form
  userForm: {
    id?: number;
    username: string;
    email: string;
    password: string;
    roleId?: number;
  } = {
    username: '',
    email: '',
    password: '',
    roleId: undefined,
  };

  // List of roles (fetched from RoleService)
  roles: IRole[] = [];

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchRoles();
  }

  /**
   * Retrieves all users from the backend.
   */
  fetchUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: IUser[]) => {
        this.dataSource.data = users.map(user => ({
          ...user,
          photo: this.getRandomPhoto()
        }));
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.errorMessage = 'Error fetching users. Please try again later.';
      },
    });
  }

  /**
   * Retrieves all roles from the backend.
   */
  fetchRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles: IRole[]) => {
        this.roles = roles;
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
        this.errorMessage = 'Error fetching roles. Please try again later.';
      },
    });
  }

  /**
   * Open the form for adding a new user.
   */
  openAddUserForm(): void {
    this.isEditMode = false;
    this.userForm = {
      username: '',
      email: '',
      password: '',
      roleId: undefined,
    };
    this.showForm = true;
  }

  /**
   * Open the form for editing an existing user.
   * @param user The user to edit.
   */
  openEditUserForm(user: IUser): void {
    this.isEditMode = true;
    this.userForm = {
      id: user.id,
      username: user.username,
      email: user.email,
      password: '', // Leave blank unless updating
      roleId: user.roleId,
    };
    this.showForm = true;
  }

  /**
   * Saves the user. Calls update if in edit mode; otherwise, registers a new user.
   */
  saveUser(): void {
    if (this.isEditMode) {
      if (!this.userForm.id) return;
      this.userService
        .updateUser(
          this.userForm.id,
          this.userForm.username,
          this.userForm.password,
          this.userForm.email,
          this.userForm.roleId
        )
        .subscribe({
          next: (updatedUser: IUser) => {
            console.log('User updated successfully:', updatedUser);
            this.fetchUsers();
            this.closeUserForm();
          },
          error: (err) => {
            console.error('Error updating user:', err);
            this.errorMessage = 'Error updating user. Please try again later.';
          },
        });
    } else {
      this.authService
        .register(
          this.userForm.username,
          this.userForm.password,
          this.userForm.email,
          this.userForm.roleId || 0
        )
        .subscribe({
          next: (newUser: IUser) => {
            console.log('User registered successfully:', newUser);
            this.fetchUsers();
            this.closeUserForm();
          },
          error: (err) => {
            console.error('Error registering user:', err);
            this.errorMessage = 'Error registering user. Please try again later.';
          },
        });
    }
  }

  /**
   * Deletes the user with the given ID.
   * @param id The user's ID.
   */
  deleteUser(id: number | undefined): void {
    if (!id) return;
    this.userService.deleteUser(id).subscribe({
      next: (response: string) => {
        console.log('User deleted successfully:', response);
        this.fetchUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.errorMessage = 'Error deleting user. Please try again later.';
      },
    });
  }

  /**
   * Closes the form view and shows the table.
   */
  closeUserForm(): void {
    this.showForm = false;
  }

  /**
   * Optional: Handle role selection changes.
   */
  changing(event: any): void {
    console.log('Role selection changed:', event.value);
  }

  /**
   * Get a random photo from the assets/profile directory.
   */
  getRandomPhoto(): string {
    const randomIndex = Math.floor(Math.random() * 10) + 1;
    return `assets/images/profile/user-${randomIndex}.jpg`;
  }
}