export interface IMaintenance {

    id: number;
    type: string;
    cost: number;
    maintenanceDate: Date;
    notes: string;
    vehicleID: number;
}