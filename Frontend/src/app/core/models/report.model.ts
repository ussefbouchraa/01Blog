// Purpose: Report request and response models.
// Matches backend ReportRequest.java and ReportResponse.java.

import { AuthorResponse } from './post.model';

export interface ReportRequest {
  reportedUserId?: number | null;
  reportedPostId?: number | null;
  reason: string;
}

export interface ReportResponse {
  id: number;
  reporter: AuthorResponse;
  reportedUser: AuthorResponse | null;
  reportedPostId: number | null;
  reason: string;
  status: string;
  createdAt: string;
}
