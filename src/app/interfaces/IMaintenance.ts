export interface IMaintenance {
    id?: number;
    type: string;
    cost: number;
    maintenanceDate: string;
    notes: string;
    vehicleID: number;
    status?: string; // Added status field
    driverId?: number; // Added driverId field
}