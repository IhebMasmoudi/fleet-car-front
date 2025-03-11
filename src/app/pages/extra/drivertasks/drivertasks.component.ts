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
  isUpdating: Set<number> = new Set(); // Track updating missions
  
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

  private loadToken(): void {
    this.token = this.authService.getToken();
    console.log('JWT Token:', this.token || 'No token found');
  }

  private loadUserProfile(): void {
    let userId = this.authService.getUserId();
    if (!userId && this.token) {
      const decoded = this.decodeToken(this.token);
      const email = decoded?.sub;
      if (email) {
        console.log('Email from token:', email);
        this.userService.getAllUsers().subscribe({
          next: (users: IUser[]) => {
            const foundUser = users.find(u => u.email === email);
            if (foundUser) {
              this.authService.setUserId(foundUser.id?.toString() || '');
              this.authService.setUserName(foundUser.username);
              this.user = foundUser;
              console.log('User profile loaded by email:', foundUser);
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

  private loadMissionsByDriver(userId: number): void {
    this.missionsService.getMissionsByDriver(userId).subscribe({
      next: (missions: IMission[]) => {
        this.missions = missions;
        this.filteredMissions = [...missions];
        console.log('Missions loaded for driver:', missions);
      },
      error: (err) => {
        console.error('Error fetching missions:', err);
        this.showError('Failed to load mission data.');
      }
    });
  }

  applyFilters(): void {
    this.filteredMissions = this.missions.filter(mission => {
      if (this.statusFilter !== 'all' && mission.status.toLowerCase() !== this.statusFilter) {
        return false;
      }
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

  resetFilters(): void {
    this.statusFilter = 'all';
    this.dateRange.start = null;
    this.dateRange.end = null;
    this.filteredMissions = [...this.missions];
  }

  getStatusIcon(mission: IMission): string {
    switch (mission.status.toLowerCase()) {
      case 'pending': return 'schedule';
      case 'in-progress': return 'directions_car';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'help_outline';
    }
  }

  getStatusIconClass(mission: IMission): string {
    return `status-icon-${mission.status.toLowerCase().replace(' ', '-')}`;
  }

  getActiveMissionsCount(): number {
    return this.missions.filter(m => m.status.toLowerCase() === 'in-progress').length;
  }

  getCompletedMissionsCount(): number {
    return this.missions.filter(m => m.status.toLowerCase() === 'completed').length;
  }

  getTotalDistance(): number {
    return this.missions.reduce((total, mission) => total + mission.distance, 0);
  }

  viewMissionDetails(mission: IMission): void {
    console.log('View details for mission:', mission);
  }

  updateMissionStatus(mission: IMission, newStatus: string): void {
    if (!mission.id) {
      this.showError('Cannot update mission: Mission ID is missing');
      return;
    }

    this.isUpdating.add(mission.id);
    const updatedMission = { ...mission, status: newStatus };

    this.missionsService.updateMission(mission.id, updatedMission).subscribe({
      next: (updated: IMission) => {
        const index = this.missions.findIndex(m => m.id === mission.id);
        if (index !== -1) {
          this.missions[index].status = newStatus;
          this.filteredMissions = [...this.missions];
          this.showSuccess(`Mission status updated to ${newStatus}`);
        }
        this.isUpdating.delete(mission.id!);
      },
      error: (err) => {
        console.error('Error updating mission status:', err);
        this.showError('Failed to update mission status');
        this.isUpdating.delete(mission.id!);
      }
    });
  }

  reportIssue(mission: IMission): void {
    console.log('Report issue for mission:', mission);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}