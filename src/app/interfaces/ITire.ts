export interface ITire {
  id?: number;
  brand: string;
  model: string;
  installationDate: string; // Use string for date representation
  mileageAtInstallation: number;
  replacementReason: string;
vehicleId: number;
}