export interface IParkingSlot {
  id?: number;
  location: string;
  status: string; // "reserve" or "reserved"
  assignedVehicleID: number | null;
}

// Extend your parking slot interface to include UI flags.
export interface ExtendedParkingSlot extends IParkingSlot {
  editMode?: boolean;       // For toggling the reservation form on a free slot.
  selectedCarId?: number | null; // Temporarily holds the car selection.
}