// Purpose: Posts service for post-related API calls.
// Handles CRUD operations for posts, likes, and feed endpoints.
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import { PostResponse, LikeResponse } from '../../core/models';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  constructor(private api: ApiService) {}

  // GET /api/feed — feed posts from creators the current user follows
  getFeed(): Observable<PostResponse[]> {
    return this.api.get<PostResponse[]>('/feed');
  }

  // GET /api/posts — all posts (used for discovery fallback)
  getAllPosts(): Observable<PostResponse[]> {
    return this.api.get<PostResponse[]>('/posts');
  }

  // GET /api/posts/{id} — single post details
  getPostById(id: number): Observable<PostResponse> {
    return this.api.get<PostResponse>(`/posts/${id}`);
  }

  // POST /api/posts — create post with multipart FormData (content + optional file)
  createPost(formData: FormData): Observable<PostResponse> {
    return this.api.postFormData<PostResponse>('/posts', formData);
  }

  // PUT /api/posts/{id} — update post with multipart FormData
  updatePost(id: number, formData: FormData): Observable<PostResponse> {
    return this.api.putFormData<PostResponse>(`/posts/${id}`, formData);
  }

  // DELETE /api/posts/{id} — remove post
  deletePost(id: number): Observable<void> {
    return this.api.delete<void>(`/posts/${id}`);
  }

  // GET /api/posts/{postId}/likes — list of likes for a post
  getLikes(postId: number): Observable<LikeResponse[]> {
    return this.api.get<LikeResponse[]>(`/posts/${postId}/likes`);
  }

  // POST /api/posts/{postId}/like — like a post
  likePost(postId: number): Observable<LikeResponse> {
    return this.api.post<LikeResponse>(`/posts/${postId}/like`, {});
  }

  // DELETE /api/posts/{postId}/like — unlike a post
  unlikePost(postId: number): Observable<void> {
    return this.api.delete<void>(`/posts/${postId}/like`);
  }

  // Helper: resolves media paths returned by backend (e.g. "/uploads/abc.jpg")
  // to a fully qualified URL using environment.apiUrl base
  getMediaUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const backendBase = environment.apiUrl.replace(/\/api\/?$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendBase}${normalizedPath}`;
  }
}
