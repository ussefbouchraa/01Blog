// Purpose: Notification response model.
// Matches backend Notification.java entity returned by NotificationController.

import { PostResponse } from './post.model';
import { UserResponse } from './user.model';

export interface NotificationResponse {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedPost: PostResponse | null;
  recipient?: UserResponse;
}
