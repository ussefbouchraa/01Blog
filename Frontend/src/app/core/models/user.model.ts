// Purpose: User profile and subscription models.
// Matches backend UserResponse.java, OwnUserProfileResponse.java,
// UpdateUserRequest.java and SubscriptionResponse.java.

import { AuthorResponse } from './post.model';

export interface UserResponse {
  id: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// Returned only by GET /api/users/me — includes private email field.
export interface OwnUserProfileResponse {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// Sent to PUT /api/users/{id}. Null/undefined fields are ignored by the backend.
export interface UpdateUserRequest {
  username?: string;
  bio?: string;
}

export interface SubscriptionResponse {
  id: number;
  createdAt: string;
  subscriber: AuthorResponse;
  target: AuthorResponse;
}
