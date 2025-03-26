import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { BrandingComponent } from './branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-sidebar',
  imports: [BrandingComponent, TablerIconsModule, MaterialModule,MatIconModule,CommonModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {

  constructor() {}
  @Input() navItems: any[] = [];
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  ngOnInit(): void {}

  isMaterialIcon(iconName?: string): boolean {
    return !!iconName && !iconName.includes(':') && !iconName.startsWith('tabler-');
  }
  
  isTablerIcon(iconName?: string): boolean {
    return !!iconName && iconName.startsWith('tabler-');
  }
  
  isSolarIcon(iconName?: string): boolean {
    return !!iconName && iconName.startsWith('solar:');
  }
  
}
