export interface Notification {
  id: number;
  title: string;
  message: string;
  targetRole?: string;
  isRead: boolean; // Make sure this is boolean
  createdAt: string;
  actionLink?: string;
  referenceId?: string;
  referenceType?: string;
  read: boolean; // Add 'read' property to match backend - IMPORTANT
}