// Purpose: Post and author models.
// Matches backend PostResponse.java and AuthorResponse.java.

export interface AuthorResponse {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface PostResponse {
  id: number;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
  author: AuthorResponse;
}
