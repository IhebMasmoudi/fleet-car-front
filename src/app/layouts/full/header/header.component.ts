import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from 'src/app/services/AuthService.Service';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
    MatBadgeModule
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  constructor(private authService: AuthService, private router: Router) {}


 /**
   * Navigate to the profile page.
   */
 navigateToProfile(): void {
  this.router.navigate(['/extra/profile']);
}
  logout() {
    this.authService.logout(); // Clear the token
    this.router.navigate(['/authentication/login']); // Redirect to login page
    console.log('Logged out');
    
  }


  }
