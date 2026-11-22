// Purpose: Users service for profile-related API calls and social subscriptions.
// Handles user profile lookup, user posts, profile updates, and follow/unfollow operations.
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import { UserResponse, OwnUserProfileResponse, UpdateUserRequest, SubscriptionResponse, PostResponse } from '../../core/models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly avatarUpdatedSubject = new Subject<void>();

  // Navbar listens to this to reload the current avatar after an upload.
  readonly avatarUpdated$ = this.avatarUpdatedSubject.asObservable();

  constructor(private api: ApiService) {}

  notifyAvatarUpdated(): void {
    this.avatarUpdatedSubject.next();
  }

  // GET /api/users — get list of all public user profiles
  getAllUsers(): Observable<UserResponse[]> {
    return this.api.get<UserResponse[]>('/users');
  }

  // GET /api/users/me — get the authenticated user's own profile (includes email)
  getOwnProfile(): Observable<OwnUserProfileResponse> {
    return this.api.get<OwnUserProfileResponse>('/users/me');
  }

  // GET /api/users/{id} — get a single user's public profile
  getUserById(id: number): Observable<UserResponse> {
    return this.api.get<UserResponse>(`/users/${id}`);
  }

  // PUT /api/users/{id} — multipart form-data with changed profile fields and an optional avatar
  updateUser(id: number, data: UpdateUserRequest, avatar?: File | null): Observable<UserResponse> {
    const formData = new FormData();
    if (data.username !== undefined) formData.append('username', data.username);
    if (data.bio !== undefined) formData.append('bio', data.bio);
    if (avatar) formData.append('avatar', avatar);
    return this.api.putFormData<UserResponse>(`/users/${id}`, formData);
  }

  // GET /api/users/{id}/posts — get all posts published by a specific user
  getUserPosts(id: number): Observable<PostResponse[]> {
    return this.api.get<PostResponse[]>(`/users/${id}/posts`);
  }

  // GET /api/users/{userId}/followers — list of users who follow this user
  getFollowers(userId: number): Observable<SubscriptionResponse[]> {
    return this.api.get<SubscriptionResponse[]>(`/users/${userId}/followers`);
  }

  // GET /api/users/{userId}/following — list of users this user follows
  getFollowing(userId: number): Observable<SubscriptionResponse[]> {
    return this.api.get<SubscriptionResponse[]>(`/users/${userId}/following`);
  }

  // POST /api/users/{userId}/subscribe — current logged-in user follows this user
  follow(userId: number): Observable<SubscriptionResponse> {
    return this.api.post<SubscriptionResponse>(`/users/${userId}/subscribe`, {});
  }

  // DELETE /api/users/{userId}/subscribe — current logged-in user unfollows this user
  unfollow(userId: number): Observable<void> {
    return this.api.delete<void>(`/users/${userId}/subscribe`);
  }

  // Helper: resolves avatar media URLs from backend
  getAvatarUrl(avatarPath: string | null | undefined): string {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    const backendBase = environment.apiUrl.replace(/\/api\/?$/, '');
    const normalized = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
    return `${backendBase}${normalized}`;
  }
}
