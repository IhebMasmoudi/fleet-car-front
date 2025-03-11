export interface IAssignmentLog {
    id: number;
    driverId: number;
    vehicleId: number;
    assignedDate: Date;
    unassignedDate?: Date;
    action: string;
    
  }