// Purpose: User profile and subscription models.
// Matches backend UserResponse.java and SubscriptionResponse.java.

import { AuthorResponse } from './post.model';

export interface UserResponse {
  id: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface SubscriptionResponse {
  id: number;
  createdAt: string;
  subscriber: AuthorResponse;
  target: AuthorResponse;
}
