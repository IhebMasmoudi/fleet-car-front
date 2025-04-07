import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common'; // Added NgIf
import { FormsModule } from '@angular/forms'; // Added FormsModule
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs'; // Import Observable

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// App Services and Interfaces
import { AuthService } from 'src/app/services/AuthService.Service';
import { UserService } from 'src/app/services/UserService.service';
import { IUser } from 'src/app/interfaces/IUser';


@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ]
})
export class ProfileUserComponent implements OnInit {

  // --- Component State ---
  currentUser: IUser | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // Property to hold the photo URL for display (avoids ExpressionChanged error)
  displayPhotoUrl: string = '';

  // Form model for editable profile details
  profileForm: {
    username: string;
    email: string;
    // Add other editable IUser fields here if needed
  } = {
    username: '',
    email: '',
  };

  // Form model for password change
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Password visibility toggles
  passwordVisible = {
    current: false,
    new: false,
    confirm: false
  };

  // Store token for potential debugging or fallback scenarios
  token: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.token = this.authService.getToken();
    // Set an initial placeholder photo URL *once*
    this.displayPhotoUrl = this.getRandomPlaceholderPhotoUrl();
    this.loadUserProfile(); // Start loading the actual profile data
  }

  /**
   * Load the logged-in user's profile using ID preferably, or fallback to email from token.
   */
  private loadUserProfile(): void {
    this.errorMessage = ''; // Clear messages on load attempt
    this.successMessage = '';
    const userId = this.authService.getUserId();

    let userObservable: Observable<IUser>;

    // Determine how to fetch the user
    if (userId) {
      console.log('Loading profile using User ID:', userId);
      userObservable = this.userService.getUserById(Number(userId));
    } else if (this.token) {
      const decoded = this.decodeToken(this.token);
      const email = decoded?.sub; // Assuming email is in 'sub' claim
      if (email) {
        console.warn('Loading profile using email from token (fallback):', email);
        userObservable = this.userService.getUserByEmail(email);
      } else {
        this.errorMessage = 'User identification failed. Please log in again.';
        this.isLoading = false;
        console.error('Cannot load profile: User ID missing and email not found in token.');
        return;
      }
    } else {
      this.errorMessage = 'User identification failed. Please log in again.';
      this.isLoading = false;
      console.error('Cannot load profile: User ID and Token are missing.');
      return;
    }

    // Subscribe to the observable to get user data
    userObservable.subscribe({
      next: (user: IUser) => {
        this.isLoading = false; // Loading finished
        if (!user) {
          this.errorMessage = 'Failed to load user profile data.';
          this.currentUser = null;
          // Keep the initial random photo if loading fails
          console.error('Received null user data from service.');
        } else {
          this.currentUser = user;
          console.log('Current user profile loaded:', this.currentUser);
          this.resetProfileForm(); // Populate form with loaded data

          /* Set the display photo: use user's photo if available, else keep placeholder
          this.displayPhotoUrl = this.currentUser.photo || this.displayPhotoUrl;
          if (!this.currentUser.photo) {
             console.log('User has no profile photo, using placeholder.');
          }*/
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false; // Loading finished (with error)
        // Keep the initial random photo on error
        console.error('Error loading user profile:', err);
        this.errorMessage = `Error loading profile: ${err.error?.message || err.message || 'Server error'}`;
        this.currentUser = null;
      }
    });
  }

  /**
   * Resets the profileForm fields based on the currentUser data. Clears messages.
   */
  resetProfileForm(): void {
    if (this.currentUser) {
      this.profileForm = {
        username: this.currentUser.username || '',
        email: this.currentUser.email || '',
        // Reset other fields here if added
      };
      // Clear messages when resetting form (e.g., clicking Cancel)
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  /**
   * Updates the user's profile details (username, email).
   */
  updateProfileDetails(): void {
    if (!this.currentUser || this.currentUser.id === undefined) {
      this.errorMessage = 'Cannot update profile. User data is missing.';
      return;
    }
    this.errorMessage = ''; // Clear messages on submit attempt
    this.successMessage = '';

    console.log('Submitting profile update:', this.profileForm);

    this.userService.updateUser(
      this.currentUser.id,
      this.profileForm.username,
      undefined, // Explicitly pass undefined for the ignored password parameter
      this.profileForm.email
      // Pass other fields from profileForm here if needed
    ).subscribe({
      next: (updatedUser: IUser | null) => {
        this.successMessage = 'Profile details updated successfully!';
        console.log('Profile update successful, response:', updatedUser);
        // Reload profile to ensure data consistency and reflect changes immediately
        this.loadUserProfile();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error updating profile details:', err);
        this.errorMessage = `Error updating profile: ${err.error?.message || err.message || 'Server error'}`;
      }
    });
  }

  /**
   * Changes the user's password using the dedicated service method.
   */
  changePassword(): void {
    this.errorMessage = ''; // Clear messages on submit attempt
    this.successMessage = '';

    // Client-side Validation
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.errorMessage = 'Please fill in all password fields.';
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.errorMessage = 'New password and confirm password do not match.';
      return;
    }
    if (this.passwordForm.newPassword.length < 6) { // Example minimum length
      this.errorMessage = 'New password must be at least 6 characters long.';
      return;
    }

    console.log('Submitting password change request.');

    this.userService.updatePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: (response: string) => {
        this.successMessage = response || 'Password changed successfully!';
        // Reset password form fields after success
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        console.log('Password change successful, response:', response);
      },
      error: (err: Error) => { // Expecting Error object based on service
        console.error('Error changing password:', err);
        this.errorMessage = `Error changing password: ${err.message || 'Please check current password or server logs.'}`;
      }
    });
  }

  /**
   * Toggles the visibility of a password field.
   */
  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    this.passwordVisible[field] = !this.passwordVisible[field];
  }

  /**
   * Decode JWT token (utility function).
   */
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Generates a random placeholder photo URL.
   * This is called only once initially or if user has no photo.
   */
  private getRandomPlaceholderPhotoUrl(): string {
    const randomIndex = Math.floor(Math.random() * 10) + 1; // Assuming 10 placeholder images
    const url = `assets/images/profile/user-${randomIndex}.jpg`; // Ensure this path is correct
    console.log('Generated placeholder photo URL:', url);
    return url;
  }

  // --- Placeholder methods for future implementation ---
  onPictureUploadClick(): void {
      this.errorMessage = 'Profile picture upload is not yet implemented.';
      // TODO: Implement file input trigger and upload logic using a service call
  }
  onPictureResetClick(): void {
      this.errorMessage = 'Profile picture reset is not yet implemented.';
       // TODO: Implement call to backend service to reset picture
  }
}