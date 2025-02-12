import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/AuthService.Service';

@Component({
  selector: 'app-side-login',
  standalone: true, // Enable standalone component (Angular 19+)
  imports: [
    CommonModule, // Add CommonModule here to use *ngIf
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    RouterModule
  ],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  loginForm!: FormGroup; // Reactive form group

  constructor(
    private fb: FormBuilder, // FormBuilder for creating forms
    private authService: AuthService, // Service for authentication
    private router: Router, // For navigation
    private snackBar: MatSnackBar // For displaying notifications
  ) {
    this.loginForm = this.fb.group({
      uname: ['', [Validators.required, Validators.minLength(6)]], // Username field
      password: ['', [Validators.required]], // Password field
      remember: [false] // Remember me checkbox
    });
  }

  // Getter methods for form controls
  get uname() {
    return this.loginForm.get('uname');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get remember() {
    return this.loginForm.get('remember');
  }

  submit() {
    if (this.loginForm.valid) {
      const { uname, password } = this.loginForm.value;

      this.authService.login(uname, password).subscribe(
        (response: any) => {
          localStorage.setItem('token', response.token); // Store token in local storage

          // Show success message using MatSnackBar
          this.snackBar.open('Logged in successfully!', 'Close', {
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
          // Show error message using MatSnackBar
          this.snackBar.open('Invalid username or password', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      );
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }
}