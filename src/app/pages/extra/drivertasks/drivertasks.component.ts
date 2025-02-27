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
import { MissionsService } from 'src/app/services/Mission.Service';
import { IMission } from 'src/app/interfaces/IMission';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-drivertasks',
  templateUrl: './drivertasks.component.html',
  styleUrl: './drivertasks.component.scss',
  standalone: true,
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
export class DrivertasksComponent implements OnInit {
  user: IUser | null = null;
  token: string | null = null;
  missions: IMission[] = [];
  filteredMissions: IMission[] = [];
  
  // Filter variables
  statusFilter: string = 'all';
  dateRange = {
    start: null as Date | null,
    end: null as Date | null
  };

  constructor(
    private authService: AuthService, 
    private userService: UserService,
    private missionsService: MissionsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadToken();
    this.loadUserProfile();
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
              
              // Load missions for the user
              if (foundUser.id) {
                this.loadMissionsByDriver(foundUser.id);
              }
            } else {
              console.error('User not found for email:', email);
              this.showError('User profile not found.');
            }
          },
          error: (err) => {
            console.error('Error fetching users:', err);
            this.showError('Failed to load user data.');
          }
        });
      } else {
        console.error('Email not found in token.');
        this.showError('Authentication data is incomplete.');
      }
    } else if (userId) {
      this.userService.getUserById(Number(userId)).subscribe({
        next: (user: IUser) => {
          this.user = user;
          console.log('User profile loaded:', user);
          
          // Load missions for the user
          if (user.id) {
            this.loadMissionsByDriver(user.id);
          }
        },
        error: (err) => {
          console.error('Error fetching user profile:', err);
          this.showError('Failed to load user profile.');
        }
      });
    }
  }

  /**
   * Decode JWT token.
   */
  private decodeToken(token: string): any {
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
   * Load missions by driver ID.
   * @param userId The ID of the driver to retrieve missions for.
   */
  private loadMissionsByDriver(userId: number): void {
    this.missionsService.getMissionsByDriver(userId).subscribe({
      next: (missions: IMission[]) => {
        this.missions = missions;
        this.filteredMissions = [...missions]; // Initialize filtered missions
        console.log('Missions loaded for driver:', missions);
      },
      error: (err) => {
        console.error('Error fetching missions:', err);
        this.showError('Failed to load mission data.');
      }
    });
  }

  /**
   * Apply filters to the missions list
   */
  applyFilters(): void {
    this.filteredMissions = this.missions.filter(mission => {
      // Status filter
      if (this.statusFilter !== 'all' && mission.status.toLowerCase() !== this.statusFilter) {
        return false;
      }
      
      // Date range filter
      if (this.dateRange.start) {
        const missionStart = new Date(mission.startDate);
        if (missionStart < this.dateRange.start) {
          return false;
        }
      }
      
      if (this.dateRange.end) {
        const missionEnd = new Date(mission.endDate);
        if (missionEnd > this.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.statusFilter = 'all';
    this.dateRange.start = null;
    this.dateRange.end = null;
    this.filteredMissions = [...this.missions];
  }

  /**
   * Get icon for mission status
   */
  getStatusIcon(mission: IMission): string {
    switch (mission.status.toLowerCase()) {
      case 'pending': return 'schedule';
      case 'in-progress': return 'directions_car';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'help_outline';
    }
  }

  /**
   * Get class for status icon
   */
  getStatusIconClass(mission: IMission): string {
    return `status-icon-${mission.status.toLowerCase().replace(' ', '-')}`;
  }

  /**
   * Get count of active missions
   */
  getActiveMissionsCount(): number {
    return this.missions.filter(m => m.status.toLowerCase() === 'in-progress').length;
  }

  /**
   * Get count of completed missions
   */
  getCompletedMissionsCount(): number {
    return this.missions.filter(m => m.status.toLowerCase() === 'completed').length;
  }

  /**
   * Get total distance of all missions
   */
  getTotalDistance(): number {
    return this.missions.reduce((total, mission) => total + mission.distance, 0);
  }

  /**
   * View mission details
   */
  viewMissionDetails(mission: IMission): void {
    // Implementation for viewing mission details
    console.log('View details for mission:', mission);
    // This would typically open a dialog or navigate to a details page
  }

  /**
   * Update mission status
   */
  updateMissionStatus(mission: IMission, newStatus: string): void {
    // Implementation for updating mission status
    console.log(`Update mission ${mission.id} status to ${newStatus}`);
    
    // This would typically call a service method to update the status
    // For demonstration, we're just updating the local copy
    const index = this.missions.findIndex(m => m.id === mission.id);
    if (index !== -1) {
      this.missions[index].status = newStatus;
      this.filteredMissions = [...this.filteredMissions]; // Refresh the view
      this.showSuccess(`Mission status updated to ${newStatus}`);
    }
  }

  /**
   * Report an issue with a mission
   */
  reportIssue(mission: IMission): void {
    // Implementation for reporting an issue
    console.log('Report issue for mission:', mission);
    // This would typically open a dialog to capture issue details
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}