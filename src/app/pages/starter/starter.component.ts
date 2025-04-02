import { Component, ViewEncapsulation, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';
import * as shape from 'd3-shape';

import { DashboardApiService } from '../../services/DashboardApi.Service';
import { ChatAIService } from '../../services/ChatAI.Service';
import { DashboardSummary } from 'src/app/interfaces/DashboardSummary';
import { VehicleMileage } from 'src/app/interfaces/VehicleMileage';
import { Insurance } from 'src/app/interfaces/IInsurance';
import { ApiQueryResponse } from 'src/app/interfaces/ChatAi';

@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    NgxChartsModule,
  ],
  templateUrl: './starter.component.html',
  styleUrls: ['./starter.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class StarterComponent implements OnInit, OnDestroy {
  // View state
  showChat = false;
  
  // Dashboard data
  summaryData: DashboardSummary | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  private summarySub: Subscription | null = null;

  // Chat data
  userQuery = '';
  chatResponse: ApiQueryResponse | null = null;
  isChatLoading = false;
  chatError: string | null = null;

  // Chart data
  vehicleStatusData: any[] = [];
  costBreakdownData: any[] = [];
  topMileageData: any[] = [];
  insuranceExpiryData: any[] = [];

  // Chart configuration
  view: [number, number] = this.calculateChartDimensions(window.innerWidth);
  
  colorScheme: any = {
    name: 'custom',
    selectable: true,
    group: 'Ordinal',
    domain: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  };

  pieColorScheme: any = {
    name: 'custom',
    selectable: true,
    group: 'Ordinal',
    domain: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']
  };

  costColorScheme: any = {
    name: 'custom',
    selectable: true,
    group: 'Ordinal',
    domain: ['#10b981', '#f59e0b']
  };

  // Chart options
  readonly LegendPosition = LegendPosition;
  showXAxis = true;
  showYAxis = true;
  gradient = true;
  showLegend = true;
  animations = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  curve = shape.curveNatural;

  constructor(
    private dashboardApi: DashboardApiService,
    private chatAiService: ChatAIService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.summarySub) {
      this.summarySub.unsubscribe();
    }
  }

  refreshData(): void {
    this.loadData();
  }

  toggleView(): void {
    this.showChat = !this.showChat;
  }

  sendQuery(): void {
    if (!this.userQuery.trim()) return;

    this.isChatLoading = true;
    this.chatError = null;
    this.chatResponse = null;

    this.chatAiService.sendQuery(this.userQuery).subscribe({
      next: (response) => {
        this.chatResponse = response;
        this.isChatLoading = false;
        this.cd.markForCheck();
      },
      error: (error) => {
        this.chatError = error.message;
        this.isChatLoading = false;
        this.cd.markForCheck();
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cd.markForCheck();

    this.summarySub = forkJoin({
      summary: this.dashboardApi.getSummary(),
      mileage: this.dashboardApi.getTopMileageVehicles(5),
      insurance: this.dashboardApi.getExpiringInsurances(30)
    }).subscribe({
      next: (data) => {
        this.summaryData = data.summary;
        this.updateChartData(data.summary, data.mileage, data.insurance);
        this.isLoading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.errorMessage = err.message || 'Failed to load dashboard data.';
        this.isLoading = false;
        this.cd.markForCheck();
      }
    });
  }

  private updateChartData(summary: DashboardSummary, mileage: VehicleMileage[], insurance: Insurance[]): void {
    // Vehicle status pie chart data
    this.vehicleStatusData = Object.entries(summary.vehicleCountByStatus).map(([name, value]) => ({
      name,
      value
    }));

    // Generate monthly cost data points
    const now = new Date();
    this.costBreakdownData = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7)); // Weekly points
      return {
        name: date.toLocaleDateString(),
        value: (summary.totalOperatingCostLast30Days / 4) * (1 + Math.random() * 0.4)
      };
    }).reverse();

    // Generate vehicle mileage trend data
    this.topMileageData = mileage
      .sort((a, b) => b.mileage - a.mileage)
      .slice(0, 3)
      .flatMap(vehicle => {
        return Array.from({ length: 4 }, (_, i) => ({
          name: `Q${i + 1}`,
          value: vehicle.mileage * (0.7 + (i * 0.1) + Math.random() * 0.2),
          label: `${vehicle.brand} ${vehicle.model}`
        }));
      });

    // Generate insurance cost trend data
    const startDate = new Date();
    startDate.setDate(1);
    this.insuranceExpiryData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      return {
        name: date.toLocaleDateString(),
        value: insurance.reduce((sum, ins) =>
          new Date(ins.endDate).getMonth() === date.getMonth() ? sum + ins.cost : sum, 0)
      };
    });
  }

  onResize(event: any): void {
    this.view = this.calculateChartDimensions(event.target.innerWidth);
  }

  private calculateChartDimensions(screenWidth: number): [number, number] {
    if (screenWidth < 600) {
      return [screenWidth - 40, 180];
    } else if (screenWidth < 960) {
      return [screenWidth / 3 - 40, 200];
    } else {
      return [screenWidth / 3 - 60, 220];
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Available': '#10b981',  // Green
      'In Use': '#f59e0b',    // Orange
      'Under Maintenance': '#ef4444',  // Red
      'Reserved': '#8b5cf6'   // Purple
    };
    return colors[status] || '#4f46e5';  // Blue as fallback
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
