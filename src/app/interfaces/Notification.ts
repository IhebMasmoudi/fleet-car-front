export interface Notification {
  id: number;
  title: string;
  message: string;
  targetRole?: string;
  isRead: boolean;
  createdAt: string;
  actionLink?: string;
  referenceId?: string;
  referenceType?: string;
}
