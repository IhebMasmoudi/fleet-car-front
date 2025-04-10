import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select'; // Import MatSelectModule for role selection
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/AuthService.Service';
import { RoleService } from 'src/app/services/RoleService.Service'; // Service to fetch roles
import { IRole } from 'src/app/interfaces/IRole'; // Interface for role

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatSelectModule, 
    RouterModule
  ],
  templateUrl: './side-register.component.html',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  roles: IRole[] = []; // Array to store fetched roles
  selectedRole?: IRole; // To store the selected role

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private roleService: RoleService, // Inject RoleService
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchAllRoles(); // Fetch roles on component initialization
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      roleIds: [null, Validators.required] // Initialize roleIds as null and add required validator
    });
  }

  // Getter method for form controls
  get f() {
    return this.registerForm.controls;
  }

  register() {
    if (this.registerForm.valid) {
      const { username, password, email, roleIds } = this.registerForm.value;
      this.authService.register(username, password, email, roleIds).subscribe(
        (response: any) => {
          this.snackBar.open('Registered successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.router.navigate(['/dashboard']).catch(error => {
            console.error('Navigation failed:', error);
          });
        },
        (error: any) => {
          this.snackBar.open('Registration failed. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          console.error('Registration failed:', error);
        }
      );
    }
  }

  // Fetch all roles from the backend
  fetchAllRoles() {
    this.roleService.getAllRoles().subscribe(
      (data: IRole[]) => {
        this.roles = data; // Assign fetched roles to the roles array
        console.log('Fetched roles:', this.roles);
      },
      (error) => {
        console.error('Error fetching roles:', error);
      }
    );
  }

  // Handle role selection change
  changing(event: any) {
    const selectedRoleId = event.value; // Get the selected role ID
    this.selectedRole = this.roles.find(role => role.id === selectedRoleId); // Find the selected role object
    console.log('Selected Role:', this.selectedRole);

    // Update the form with the selected role ID
    this.registerForm.patchValue({ roleIds: selectedRoleId });
    console.log('Updated Form:', this.registerForm.value);
  }
}