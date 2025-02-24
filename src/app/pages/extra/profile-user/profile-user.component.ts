import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/AuthService.Service';
import { UserService } from 'src/app/services/UserService.service';
import { IUser } from 'src/app/interfaces/IUser';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss'],
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
    MatNativeDateModule
  ]
})
export class ProfileUserComponent implements OnInit {
  user: IUser | null = null;
  token: string | null = null;
  photoUrl: string = '';

  constructor(private authService: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.loadToken();
    this.loadUserProfile();
    this.photoUrl = this.getRandomPhoto();
  }

  /**
   * Load the JWT token from local storage.
   */
  private loadToken(): void {
    this.token = this.authService.getToken();
    console.log('JWT Token:', this.token || 'No token found');
  }

  /**
   * Load the logged-in user's profile.
   * If the user ID is missing, decode the token and look up the user by email.
   */
  private loadUserProfile(): void {
    let userId = this.authService.getUserId();
    if (!userId && this.token) {
      // Decode the token to get the email (assuming the token payload contains the email in "sub")
      const decoded = this.decodeToken(this.token);
      const email = decoded?.sub;
      if (email) {
        console.log('Email from token:', email);
        // Fetch all users and find the one with the matching email
        this.userService.getAllUsers().subscribe({
          next: (users: IUser[]) => {
            const foundUser = users.find(u => u.email === email);
            if (foundUser) {
              // Store user details for later use
              this.authService.setUserId(foundUser.id?.toString() || '');
              this.authService.setUserName(foundUser.username);
              this.user = foundUser;
              console.log('User profile loaded by email:', foundUser);
            } else {
              console.error('User not found for email:', email);
            }
          },
          error: (err) => console.error('Error fetching users:', err)
        });
      } else {
        console.error('Email not found in token.');
      }
    } else if (userId) {
      this.userService.getUserById(Number(userId)).subscribe({
        next: (user: IUser) => {
          this.user = user;
          console.log('User profile loaded:', user);
        },
        error: (err) => console.error('Error fetching user profile:', err)
      });
    }
  }

  /**
   * Decode JWT token.
   */
  decodeToken(token: string): any {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Get a random photo from the assets/profile directory.
   */
  getRandomPhoto(): string {
    const randomIndex = Math.floor(Math.random() * 10) + 1;
    return `assets/images/profile/user-${randomIndex}.jpg`;
  }
}