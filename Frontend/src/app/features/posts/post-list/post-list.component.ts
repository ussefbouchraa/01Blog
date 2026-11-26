// Purpose: Post list / Feed component.
// Implements 3-column dashboard matching the homepage wireframe:
// - Left: Menu (Home, My Block/Profile, Explore)
// - Center: Share your learning (quick publisher) + Your Feed
// - Right: Suggested Friends
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PostsService } from '../posts.service';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LikeResponse, PostResponse, UserResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal.component';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    LoadingComponent,
    ConfirmModalComponent,
    ReportModalComponent
  ],
  template: `
    <div class="row g-4">
      <!-- LEFT COLUMN: MENU -->
      <aside class="col-12 col-md-3 col-lg-3">
        <div class="wireframe-card p-3 mb-4">
          <div class="text-uppercase fw-bold text-secondary small mb-3 px-2" style="letter-spacing: 0.5px;">
            MENU
          </div>
          <nav class="d-flex flex-column gap-1">
            <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="wireframe-menu-link">
              <i class="bi bi-house me-2"></i>Home
            </a>
            <a routerLink="/users/me" routerLinkActive="active" class="wireframe-menu-link">
              <i class="bi bi-person-badge me-2"></i>My Block
            </a>
            <a routerLink="/home" (click)="toggleExplore($event)" class="wireframe-menu-link" [class.active]="isDiscoveryMode">
              <i class="bi bi-compass me-2"></i>Explore
            </a>
          </nav>
        </div>
      </aside>

      <!-- CENTER COLUMN: SHARE YOUR LEARNING + FEED -->
      <main class="col-12 col-md-9 col-lg-6">
        <!-- Share your learning Box -->
        <div class="wireframe-card p-4 mb-4">
          <h5 class="fw-bold text-dark mb-3">Share your learning</h5>
          <div class="mb-3">
            <textarea
              class="form-control border-0 bg-light p-3 rounded-3"
              rows="3"
              placeholder="What did you learn today?"
              [(ngModel)]="newPostContent"
              style="resize: none;"></textarea>
          </div>

          @if (selectedFile) {
            <div class="alert alert-secondary py-1 px-2 d-flex align-items-center justify-content-between mb-3 small">
              <span class="text-truncate me-2"><i class="bi bi-paperclip me-1"></i>{{ selectedFile.name }}</span>
              <button type="button" class="btn btn-sm btn-link text-danger p-0 text-decoration-none" (click)="removeSelectedFile()">
                <i class="bi bi-x-circle-fill"></i>
              </button>
            </div>
          }

          <div class="d-flex justify-content-between align-items-center">
            <div>
              <input
                #fileInput
                type="file"
                class="d-none"
                accept="image/*,video/*"
                (change)="onFileSelected($event)" />
              <button
                type="button"
                class="btn btn-light rounded-circle text-muted p-2"
                title="Attach photo/video"
                (click)="fileInput.click()">
                <i class="bi bi-image fs-5"></i>
              </button>
            </div>
            <button
              type="button"
              class="btn btn-primary px-4 rounded-pill fw-semibold shadow-sm"
              [disabled]="publishing || !newPostContent.trim()"
              (click)="publishPost()">
              @if (publishing) {
                <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                Publishing...
              } @else {
                Publish
              }
            </button>
          </div>
        </div>

        <!-- Feed Section Header -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h5 class="fw-bold text-dark mb-0">Your Feed</h5>
        </div>

        <!-- Loading State -->
        @if (loading) {
          <app-loading message="Loading feed..."></app-loading>
        }

        <!-- Error State -->
        @if (errorMessage) {
          <div class="alert alert-danger d-flex align-items-center justify-content-between shadow-sm" role="alert">
            <div>
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ errorMessage }}
            </div>
            <button class="btn btn-sm btn-outline-danger" (click)="loadPosts()">
              <i class="bi bi-arrow-clockwise me-1"></i>Retry
            </button>
          </div>
        }

        <!-- Empty Feed -->
        @if (!loading && !errorMessage && posts.length === 0) {
          <div class="wireframe-card text-center py-5 p-4 mb-4">
            <i class="bi bi-journal-x display-4 text-muted mb-3 d-block"></i>
            <h6 class="fw-bold">No posts available yet</h6>
            <p class="text-muted small mb-0">Be the first to share your learning above!</p>
          </div>
        }

        <!-- Posts List -->
        @if (!loading && posts.length > 0) {
          <div class="d-flex flex-column gap-3">
            @for (post of posts; track post.id) {
              <article class="wireframe-card p-4 post-card" (click)="openPost($event, post)">
                <!-- Post Header: Username & time ago -->
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <div class="d-flex align-items-center gap-2">
                    <a [routerLink]="['/users', post.author.id]" class="text-decoration-none">
                      @if (post.author.avatarUrl) {
                        <img
                          [src]="postsService.getMediaUrl(post.author.avatarUrl)"
                          alt="{{ post.author.username }}'s avatar"
                          class="rounded-circle object-fit-cover shadow-sm"
                          width="36"
                          height="36" />
                      } @else {
                        <div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 36px; height: 36px;">
                          <i class="bi bi-person-fill"></i>
                        </div>
                      }
                    </a>
                    <div>
                      <a [routerLink]="['/users', post.author.id]" class="fw-semibold text-dark text-decoration-none">
                        {{ post.author.username }}
                      </a>
                      <span class="text-muted small ms-1">· {{ formatTimeAgo(post.createdAt) }}</span>
                    </div>
                  </div>

                  <!-- Post actions dropdown -->
                  <div class="dropdown post-menu">
                    <button
                      type="button"
                      class="btn btn-sm p-1 border-0 text-muted"
                      title="Post options"
                      aria-label="Post options"
                      aria-haspopup="menu"
                      [attr.aria-expanded]="openMenuPostId === post.id"
                      (click)="toggleMenu($event, post)">
                      <i class="bi bi-three-dots-vertical fs-5"></i>
                    </button>

                    @if (openMenuPostId === post.id) {
                      <div class="dropdown-menu dropdown-menu-end show shadow-sm" role="menu">
                        @if (canManagePost(post.author.id)) {
                          <button
                            type="button"
                            class="dropdown-item d-flex align-items-center"
                            role="menuitem"
                            (click)="editPost(post)">
                            <i class="bi bi-pencil me-2"></i>Edit post
                          </button>
                          <button
                            type="button"
                            class="dropdown-item text-danger d-flex align-items-center"
                            role="menuitem"
                            (click)="promptDeletePost(post)">
                            <i class="bi bi-trash me-2"></i>Delete post
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="dropdown-item text-danger d-flex align-items-center"
                            role="menuitem"
                            (click)="reportPost(post)">
                            <i class="bi bi-flag me-2"></i>Report post
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Post Content -->
                <p class="text-dark mb-3 text-break" style="white-space: pre-line;">{{ post.content }}</p>

                <!-- Post Media -->
                @if (post.mediaUrl) {
                  <div class="rounded-3 overflow-hidden bg-light mb-3 text-center border">
                    @if (isImageMedia(post.mediaType)) {
                      <img
                        [src]="postsService.getMediaUrl(post.mediaUrl)"
                        alt="Post media"
                        class="img-fluid"
                        style="max-height: 400px; width: 100%; object-fit: cover;"
                        loading="lazy" />
                    } @else if (isVideoMedia(post.mediaType)) {
                      <video
                        [src]="postsService.getMediaUrl(post.mediaUrl)"
                        controls
                        class="w-100"
                        style="max-height: 400px;">
                        Your browser does not support the video tag.
                      </video>
                    }
                  </div>
                }

                <!-- Actions: Like & Comment -->
                <div class="d-flex align-items-center gap-4 pt-2 border-top text-muted small">
                  <button
                    type="button"
                    class="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center gap-1 hover-primary"
                    [disabled]="isLikeLoading(post.id)"
                    (click)="toggleLike(post)">
                    <i class="bi" [ngClass]="isPostLiked(post.id) ? 'bi-heart-fill text-danger' : 'bi-heart'"></i>
                    <span class="fw-semibold">{{ getLikeCount(post.id) }}</span>
                    <span>{{ getLikeCount(post.id) === 1 ? 'Like' : 'Likes' }}</span>
                  </button>

                  <a [routerLink]="['/posts', post.id]" class="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center gap-1 hover-primary">
                    <i class="bi bi-chat"></i>
                    <span>Comment</span>
                  </a>
                </div>
              </article>
            }
          </div>
        }
      </main>

      <!-- RIGHT COLUMN: Suggested Friends -->
      <aside class="col-12 col-md-12 col-lg-3">
        <div class="wireframe-card p-4">
          <h6 class="fw-bold text-dark mb-3">Suggested Friends</h6>
          @if (suggestedStudents.length === 0) {
            <p class="text-muted small mb-0">No other students found yet.</p>
          } @else {
            <div class="d-flex flex-column gap-3">
              @for (student of suggestedStudents; track student.id) {
                <div class="d-flex align-items-center justify-content-between">
                  <a [routerLink]="['/users', student.id]" class="text-decoration-none d-flex align-items-center gap-2 flex-grow-1 text-truncate">
                    @if (student.avatarUrl) {
                      <img
                        [src]="usersService.getAvatarUrl(student.avatarUrl)"
                        alt="Avatar"
                        class="rounded-circle object-fit-cover"
                        width="32"
                        height="32" />
                    } @else {
                      <div class="bg-light border rounded-circle d-flex align-items-center justify-content-center text-secondary" style="width: 32px; height: 32px;">
                        <i class="bi bi-person-fill small"></i>
                      </div>
                    }
                    <span class="text-dark fw-medium small text-truncate">{{ student.username }}</span>
                  </a>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary rounded-pill py-0 px-2 small"
                    (click)="followStudent(student)">
                    Follow
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </aside>
    </div>

    <!-- Delete confirmation for a post from the dropdown -->
    <app-confirm-modal
      #confirmModal
      title="Delete Post"
      message="Are you sure you want to delete this post? Its comments and likes will be removed permanently."
      confirmText="Yes, Delete Post"
      [loading]="deleteLoading"
      (confirmed)="onDeletePostConfirm()"
      (cancelled)="onDeletePostCancel()">
    </app-confirm-modal>

    <!-- Report a post from the dropdown -->
    <app-report-modal
      #reportModal
      [reportedPostId]="reportTargetPostId">
    </app-report-modal>
  `,
  styles: [`
    .hover-primary:hover {
      color: #0d6efd !important;
    }
    .post-card {
      cursor: pointer;
    }
    .post-menu {
      position: relative;
    }
    .post-menu .dropdown-menu {
      min-width: 160px;
    }
  `]
})
export class PostListComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  @ViewChild('reportModal') reportModal!: ReportModalComponent;

  posts: PostResponse[] = [];
  suggestedStudents: UserResponse[] = [];
  likedPostIds = new Set<number>();
  likeCounts = new Map<number, number>();
  likeLoadingPostIds = new Set<number>();
  isDiscoveryMode = false;
  loading = true;
  errorMessage = '';

  newPostContent = '';
  selectedFile: File | null = null;
  publishing = false;

  openMenuPostId: number | null = null;
  deleteLoading = false;
  reportTargetPostId: number | null = null;
  private pendingDeletePost: PostResponse | null = null;
  private currentUserId: number | null = null;
  private isAdmin = false;

  constructor(
    public postsService: PostsService,
    public usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.isAdmin = this.authService.getRole() === 'ROLE_ADMIN';
    this.loadPosts();
    this.loadSuggestedStudents();
  }

  loadPosts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.isDiscoveryMode = false;

    this.postsService.getFeed().subscribe({
      next: (feed) => {
        if (feed && feed.length > 0) {
          this.posts = feed;
          this.isDiscoveryMode = false;
          this.loading = false;
          this.loadLikesForPosts(feed);
        } else {
          this.loadDiscoveryPosts();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.status === 0
            ? 'Cannot reach the backend service. Please ensure the server is running.'
            : err.error?.message || 'Failed to load your feed.';
      }
    });
  }

  private loadDiscoveryPosts(): void {
    this.postsService.getAllPosts().subscribe({
      next: (allPosts) => {
        this.posts = allPosts || [];
        this.isDiscoveryMode = true;
        this.loading = false;
        this.loadLikesForPosts(this.posts);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load discovery posts.';
      }
    });
  }

  loadSuggestedStudents(): void {
    const currentUserId = this.authService.getUserId();
    this.usersService.getAllUsers().subscribe({
      next: (users) => {
        // Exclude current logged in user and limit to top 5
        this.suggestedStudents = (users || [])
          .filter((u) => u.id !== currentUserId)
          .slice(0, 5);
      },
      error: () => {}
    });
  }

  toggleExplore(event: Event): void {
    event.preventDefault();
    if (this.isDiscoveryMode) {
      this.loadPosts();
    } else {
      this.loading = true;
      this.loadDiscoveryPosts();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  publishPost(): void {
    const content = this.newPostContent.trim();
    if (!content || this.publishing) return;

    this.publishing = true;
    const formData = new FormData();
    formData.append('content', content);
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.postsService.createPost(formData).subscribe({
      next: (createdPost) => {
        this.publishing = false;
        this.newPostContent = '';
        this.removeSelectedFile();
        this.notificationService.success('Post shared successfully!');
        // Prepend new post to current feed
        this.posts = [createdPost, ...this.posts];
        this.setLikeCount(createdPost.id, 0);
        this.setPostLiked(createdPost.id, false);
      },
      error: (err) => {
        this.publishing = false;
        this.notificationService.error(err.error?.message || 'Failed to share post.');
      }
    });
  }

  toggleLike(post: PostResponse): void {
    if (this.isLikeLoading(post.id)) return;

    const wasLiked = this.isPostLiked(post.id);
    const previousCount = this.getLikeCount(post.id);

    // Match the post-detail behavior: update immediately and roll back on error.
    this.setPostLiked(post.id, !wasLiked);
    this.setLikeCount(post.id, wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1);
    this.setLikeLoading(post.id, true);

    if (wasLiked) {
      this.postsService.unlikePost(post.id).subscribe({
        next: () => {
          this.setLikeLoading(post.id, false);
        },
        error: (err) => {
          this.setPostLiked(post.id, wasLiked);
          this.setLikeCount(post.id, previousCount);
          this.setLikeLoading(post.id, false);
          this.notificationService.error(err.error?.message || 'Could not unlike post.');
        }
      });
    } else {
      this.postsService.likePost(post.id).subscribe({
        next: () => {
          this.setLikeLoading(post.id, false);
        },
        error: (err) => {
          this.setPostLiked(post.id, wasLiked);
          this.setLikeCount(post.id, previousCount);
          this.setLikeLoading(post.id, false);
          this.notificationService.error(err.error?.message || 'Could not like post.');
        }
      });
    }
  }

  private loadLikesForPosts(posts: PostResponse[]): void {
    this.likedPostIds = new Set<number>();
    this.likeCounts = new Map(posts.map((post) => [post.id, 0]));
    this.likeLoadingPostIds = new Set(posts.map((post) => post.id));

    if (posts.length === 0) return;

    const currentUserId = this.authService.getUserId();
    forkJoin(
      posts.map((post) =>
        this.postsService.getLikes(post.id).pipe(
          catchError(() => of([] as LikeResponse[]))
        )
      )
    ).subscribe((likesByPost) => {
      const counts = new Map<number, number>();
      const likedIds = new Set<number>();

      posts.forEach((post, index) => {
        const likes = likesByPost[index];
        counts.set(post.id, likes.length);
        if (currentUserId !== null && likes.some((like) => like.user?.id === currentUserId)) {
          likedIds.add(post.id);
        }
      });

      this.likeCounts = counts;
      this.likedPostIds = likedIds;
      this.likeLoadingPostIds = new Set<number>();
    });
  }

  isPostLiked(postId: number): boolean {
    return this.likedPostIds.has(postId);
  }

  getLikeCount(postId: number): number {
    return this.likeCounts.get(postId) ?? 0;
  }

  isLikeLoading(postId: number): boolean {
    return this.likeLoadingPostIds.has(postId);
  }

  private setPostLiked(postId: number, liked: boolean): void {
    const likedIds = new Set(this.likedPostIds);
    if (liked) {
      likedIds.add(postId);
    } else {
      likedIds.delete(postId);
    }
    this.likedPostIds = likedIds;
  }

  private setLikeCount(postId: number, count: number): void {
    const counts = new Map(this.likeCounts);
    counts.set(postId, count);
    this.likeCounts = counts;
  }

  private setLikeLoading(postId: number, loading: boolean): void {
    const loadingIds = new Set(this.likeLoadingPostIds);
    if (loading) {
      loadingIds.add(postId);
    } else {
      loadingIds.delete(postId);
    }
    this.likeLoadingPostIds = loadingIds;
  }

  followStudent(student: UserResponse): void {
    this.usersService.follow(student.id).subscribe({
      next: () => {
        this.notificationService.success(`Followed ${student.username}`);
        // Remove from suggested list
        this.suggestedStudents = this.suggestedStudents.filter((s) => s.id !== student.id);
        // Refresh feed
        this.loadPosts();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to follow user.');
      }
    });
  }

  // Clicking the post card opens the post detail page — same as the action menu.
  // Nested controls (author links, action dropdown, Like, Comment, video player)
  // keep their own behaviour, and selecting text does not trigger navigation.
  openPost(event: MouseEvent, post: PostResponse): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button, video, input, textarea, select, .dropdown-menu')) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    this.router.navigate(['/posts', post.id]);
  }

  // --- Post actions dropdown ---------------------------------------------

  toggleMenu(event: Event, post: PostResponse): void {
    event.stopPropagation();
    this.openMenuPostId = this.openMenuPostId === post.id ? null : post.id;
  }

  closeMenu(): void {
    this.openMenuPostId = null;
  }

  // Close the dropdown when clicking anywhere outside it.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.openMenuPostId === null) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.post-menu')) return;
    this.openMenuPostId = null;
  }

  canManagePost(authorId: number): boolean {
    if (this.isAdmin) return true;
    return this.currentUserId !== null && this.currentUserId === authorId;
  }

  editPost(post: PostResponse): void {
    this.closeMenu();
    this.router.navigate(['/posts', post.id, 'edit']);
  }

  reportPost(post: PostResponse): void {
    this.closeMenu();
    this.reportTargetPostId = post.id;
    this.reportModal.show();
  }

  promptDeletePost(post: PostResponse): void {
    this.closeMenu();
    if (this.deleteLoading) return;
    this.pendingDeletePost = post;
    this.confirmModal.show();
  }

  onDeletePostCancel(): void {
    if (!this.deleteLoading) {
      this.pendingDeletePost = null;
    }
  }

  onDeletePostConfirm(): void {
    const target = this.pendingDeletePost;
    if (!target || this.deleteLoading) return;

    this.deleteLoading = true;
    this.postsService.deletePost(target.id).subscribe({
      next: () => {
        this.posts = this.posts.filter((post) => post.id !== target.id);
        this.pendingDeletePost = null;
        this.deleteLoading = false;
        this.confirmModal.close();
        this.notificationService.success('Post deleted successfully.');
      },
      error: (err) => {
        this.deleteLoading = false;
        this.notificationService.error(err.error?.message || 'Failed to delete post.');
      }
    });
  }

  formatTimeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  isImageMedia(type: string | null | undefined): boolean {
    if (!type) return false;
    const lower = type.toLowerCase();
    return lower === 'image' || lower.startsWith('image/');
  }

  isVideoMedia(type: string | null | undefined): boolean {
    if (!type) return false;
    const lower = type.toLowerCase();
    return lower === 'video' || lower.startsWith('video/');
  }
}
