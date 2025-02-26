export interface ICars {
    id?: number;
    model: string;
    brand: string;
    licensePlate: string;
    year: number;
    fuelType: string;
    mileage: number;
    status: string; // Available, In Maintenance, Assigned
    type: string; // Car, Truck, Van
    photoUrl?: string; // URL to the car's photo
   
  }