export interface Document {
    id: number;
    documentName: string;
    documentType: string;
    data: Blob;
    vehicleId: number;
  }