// Interface matching the backend DashboardSummary
export interface DashboardSummary {
    totalVehicles: number;
    totalDrivers: number;
    vehicleCountByStatus: { [key: string]: number }; // e.g., { "active": 10, "inactive": 5 }
    parkingSlotStatusCounts: { [key: string]: number }; // e.g., { "available": 20, "occupied": 15 }
  
    // --- TOP 5 KPIs ---
    vehicleAvailabilityPercentage: number;
    vehiclesRequiringAttentionCount: number;
    totalOperatingCostLast30Days: number;
    activeMissionsCount: number;
    activeDriversCount: number;
  
    // --- Supporting Details ---
    upcomingInsuranceExpirationsCount30Days: number;
    totalMaintenanceCostLast30Days: number;
    totalFuelCostLast30Days: number;
  }