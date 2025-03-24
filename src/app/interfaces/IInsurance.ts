// This interface represents the structure of an insurance object
export interface Insurance {
    id: number;
    policyNumber: string;
    provider: string;
    startDate: string; // or Date if you want to work with Date objects in Angular
    endDate: string;   // or Date
    cost: number;
    status: string;
    vehicleID: number; // Assuming you'll select vehicle by ID
  }