// Purpose: HTTP service for post comments.
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentRequest, CommentResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  constructor(private api: ApiService) {}

  getComments(postId: number): Observable<CommentResponse[]> {
    return this.api.get<CommentResponse[]>(`/posts/${postId}/comments`);
  }

  addComment(postId: number, content: string): Observable<CommentResponse> {
    const request: CommentRequest = { content };
    return this.api.post<CommentResponse>(`/posts/${postId}/comments`, request);
  }

  updateComment(id: number, content: string): Observable<CommentResponse> {
    const request: CommentRequest = { content };
    return this.api.put<CommentResponse>(`/comments/${id}`, request);
  }

  deleteComment(id: number): Observable<void> {
    return this.api.delete<void>(`/comments/${id}`);
  }
}
