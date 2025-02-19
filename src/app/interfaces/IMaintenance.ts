export interface IMaintenance {

    id?: number;
    type: string;
    cost: number;
    maintenanceDate: string;
    notes: string;
    vehicleID: number;
}