// Purpose: Like response model.
// Matches backend LikeResponse.java.

import { AuthorResponse } from './post.model';

export interface LikeResponse {
  id: number;
  postId: number;
  createdAt: string;
  user: AuthorResponse;
}
