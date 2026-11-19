// Purpose: Comment request and response models.
// Matches backend CommentRequest.java and CommentResponse.java.

import { AuthorResponse } from './post.model';

export interface CommentRequest {
  content: string;
}

export interface CommentResponse {
  id: number;
  postId: number;
  content: string;
  createdAt: string;
  author: AuthorResponse;
}
