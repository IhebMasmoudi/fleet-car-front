// Icardetails.interface.ts

export interface ICarDetails {
  id: number; // Car ID
  model: string;
  brand: string;
  licensePlate: string;
  year: number;
  fuelType: string;
  mileage: number;
  status: string; // Available, In Maintenance, Assigned
  type: string; // Car, Truck, Van

  missions: Mission[]; // Array of missions
  tires: Tire[]; // Array of tires
  maintenance: Maintenance[]; // Array of maintenance records
  fuelConsumption: FuelConsumption[]; // Array of fuel consumption records
  documents: Document[]; // Array of documents
  invoices: Invoice[]; // Array of invoices
  parkingSlot: ParkingSlot | null; // Parking slot details (nullable)
  driver: Driver | null; // Driver details (nullable)
}

// Nested Interfaces

export interface Mission {
  id: number; // Mission ID
  destination: string;
  startDate: Date;
  endDate: Date;
  distance: number;
  status: string;
  vehicleID: number;
  driverID: number;
}

export interface Tire {
  id: number; // Tire ID
  brand: string; // Tire brand
  model: string; // Tire model
  installationDate: string; // Installation date (ISO format)
  mileageAtInstallation: number; // Mileage at installation
  replacementReason: string; // Reason for replacement
  vehicleId: number; // Vehicle ID
}

export interface Maintenance {
  id: number; // Maintenance ID
  type: string; // Type of maintenance
  cost: number; // Cost of maintenance
  maintenanceDate: string; // Maintenance date (ISO format)
  notes: string; // Notes about maintenance
  vehicleID: number; // Vehicle ID
}

export interface FuelConsumption {
  id: number; // Fuel consumption ID
  date: string; // Date of fuel consumption (ISO format)
  amount: number; // Amount of fuel consumed
  cost: number; // Cost of fuel
  mileage: number; // Mileage at the time of fuel consumption
  vehicleID: number; // Vehicle ID
}

export interface Document {
  id: number; // Document ID
  documentName?: string; // Optional document name
  documentType?: string; // Optional document type
  vehicleID: number; // Vehicle ID
  data?: Blob;  // Base64 or binary data for downloads
}

export interface Invoice {
  id: number; // Invoice ID
  issueDate: string; // Issue date (ISO format)
  dueDate: string; // Due date (ISO format)
  amount: number; // Invoice amount
  status: string; // Invoice status (e.g., "Paid", "Pending")
  supplierID: number; // Supplier ID
  vehicleID: number; // Vehicle ID
}

export interface ParkingSlot {
  id: number; // Parking slot ID
  location: string; // Parking slot location
  status: string; // Parking slot status (e.g., "Available", "Reserved")
  assignedVehicleID: number; // Assigned vehicle ID
}

export interface Driver {
  id?: number;
  licenseNumber: string;
  phoneNumber: string;
  status: string;
  userId: number;
  affectedVehicleID: number;
}
