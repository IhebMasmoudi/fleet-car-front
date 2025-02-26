export interface Document {
  id: number;
  documentName: string;
  documentType: string;
  vehicleID: number;
  data?: Blob;  // Base64 or binary data for downloads
}
