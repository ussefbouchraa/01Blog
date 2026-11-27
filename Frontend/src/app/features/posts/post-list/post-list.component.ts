// Purpose: Post list / Feed component.
// Modern two-column layout: composer + posts in the main column,
// profile shortcut and suggested friends in the side rail.
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PostsService } from '../posts.service';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LikeResponse, PostResponse, UserResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal.component';
import { EditPostModalComponent } from '../edit-post-modal/edit-post-modal.component';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LoadingComponent,
    ConfirmModalComponent,
    ReportModalComponent,
    EditPostModalComponent
  ],
  template: `
    <div class="home-layout row g-4">
      <!-- MAIN COLUMN: Composer + Feed -->
      <main class="col-12 col-xl-8">
        <!-- Share your story -->
        <section class="wireframe-card composer-card p-4 p-lg-5 mb-4">
          <div class="d-flex align-items-center gap-3 mb-4">
            <span class="composer-icon d-flex align-items-center justify-content-center flex-shrink-0">
              <i class="bi bi-stars"></i>
            </span>
            <div>
              <span class="feed-eyebrow">YOUR SPACE</span>
              <h1 class="composer-title mb-1">Share your story</h1>
              <p class="composer-sub mb-0">A thought, a win, or a photo — your community is listening.</p>
            </div>
          </div>
          <div class="mb-3">
            <textarea
              #composerInput
              class="form-control border-0 bg-light p-3 rounded-3"
              rows="3"
              placeholder="What did you do today?"
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
        </section>

        <!-- Feed toolbar with Feed / Explore tabs -->
        <div #feedToolbar class="feed-toolbar d-flex align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h2 class="feed-heading mb-1">{{ isDiscoveryMode ? 'Explore' : 'Your Feed' }}</h2>
            <p class="feed-toolbar-sub mb-0">
              {{ isDiscoveryMode ? 'Discover posts from the whole community' : 'The latest from your block' }}
            </p>
          </div>
          <div class="feed-tabs d-inline-flex p-1 flex-shrink-0" role="tablist" aria-label="Feed view">
            <button
              type="button"
              role="tab"
              class="feed-tab"
              [class.active]="!isDiscoveryMode"
              [attr.aria-selected]="!isDiscoveryMode"
              (click)="setFeedMode(false)">
              <i class="bi bi-house-door me-1"></i>For you
            </button>
            <button
              type="button"
              role="tab"
              class="feed-tab"
              [class.active]="isDiscoveryMode"
              [attr.aria-selected]="isDiscoveryMode"
              (click)="setFeedMode(true)">
              <i class="bi bi-compass me-1"></i>Explore
            </button>
          </div>
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
            <p class="text-muted small mb-0">Be the first to Share your story above!</p>
          </div>
        }

        <!-- Posts List -->
        @if (!loading && posts.length > 0) {
          <div class="d-flex flex-column gap-3">
            @for (post of posts; track post.id) {
              <article class="wireframe-card p-4 post-card feed-post" (click)="openPost($event, post)">
                <!-- Post Header: Username & time ago -->
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <div class="d-flex align-items-center gap-2">
                    <a [routerLink]="['/users', post.author.id]" class="text-decoration-none">
                      @if (post.author.avatarUrl) {
                        <img
                          [src]="postsService.getMediaUrl(post.author.avatarUrl)"
                          alt="{{ post.author.username }}'s avatar"
                          class="post-avatar object-fit-cover shadow-sm"
                          width="36"
                          height="36" />
                      } @else {
                        <div class="post-avatar post-avatar-placeholder d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                          <i class="bi bi-person-fill"></i>
                        </div>
                      }
                    </a>
                    <div>
                      <a [routerLink]="['/users', post.author.id]" class="post-author text-decoration-none">
                        {{ post.author.username }}
                      </a>
                      <span class="post-time ms-1">· {{ formatTimeAgo(post.createdAt) }}</span>
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
                <p class="post-content mb-3 text-break">{{ post.content }}</p>

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
                <div class="d-flex align-items-center gap-2 pt-2 border-top">
                  <button
                    type="button"
                    class="post-action d-flex align-items-center gap-1"
                    [class.liked]="isPostLiked(post.id)"
                    [disabled]="isLikeLoading(post.id)"
                    (click)="toggleLike(post)">
                    <i class="bi" [ngClass]="isPostLiked(post.id) ? 'bi-heart-fill' : 'bi-heart'"></i>
                    <span class="fw-semibold">{{ getLikeCount(post.id) }}</span>
                    <span>{{ getLikeCount(post.id) === 1 ? 'Like' : 'Likes' }}</span>
                  </button>

                  <a [routerLink]="['/posts', post.id]" class="post-action d-flex align-items-center gap-1">
                    <i class="bi bi-chat"></i>
                    <span>Comment</span>
                  </a>
                </div>
              </article>
            }
          </div>
        }
      </main>

      <!-- SIDE RAIL: Profile shortcut + Suggested Friends -->
      <aside class="col-12 col-xl-4">
        <div class="feed-rail">
          <a routerLink="/users/me" class="wireframe-card rail-profile text-decoration-none d-flex align-items-center gap-3">
            <span class="rail-profile-avatar d-flex align-items-center justify-content-center flex-shrink-0">
              @if (currentAvatarUrl) {
                <img
                  [src]="usersService.getAvatarUrl(currentAvatarUrl)"
                  alt="Your avatar"
                  class="rail-profile-avatar-img" />
              } @else {
                <i class="bi bi-person-badge"></i>
              }
            </span>
            <span class="min-w-0 flex-grow-1">
              <span class="rail-profile-label d-block">YOUR PROFILE</span>
              <span class="rail-profile-name d-block text-truncate">{{ currentUsername }}</span>
            </span>
            <i class="bi bi-arrow-up-right text-muted"></i>
          </a>
          <div class="wireframe-card suggest-card">
            <h6 class="suggest-heading mb-3">Suggested Friends</h6>
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
                          class="suggest-avatar object-fit-cover"
                          width="32"
                          height="32" />
                      } @else {
                        <div class="suggest-avatar bg-light border d-flex align-items-center justify-content-center text-secondary" style="width: 32px; height: 32px;">
                          <i class="bi bi-person-fill small"></i>
                        </div>
                      }
                      <span class="text-dark fw-medium small text-truncate">{{ student.username }}</span>
                    </a>
                    <button
                      type="button"
                      class="btn btn-sm suggest-follow py-0 px-2 small"
                      (click)="followStudent(student)">
                      Follow
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <div class="wireframe-card quick-actions-card">
            <h6 class="suggest-heading mb-3">Quick Actions</h6>
            <div class="quick-action-list">
              <button type="button" class="quick-action" (click)="focusComposer()">
                <span class="quick-action-icon quick-action-icon-primary">
                  <i class="bi bi-pencil-square"></i>
                </span>
                <span class="min-w-0 flex-grow-1">
                  <span class="quick-action-title d-block">Write a post</span>
                  <span class="quick-action-sub d-block">Share something with your block</span>
                </span>
                <i class="bi bi-chevron-right quick-action-chevron"></i>
              </button>

              <a routerLink="/users/me" class="quick-action text-decoration-none">
                <span class="quick-action-icon quick-action-icon-sky">
                  <i class="bi bi-person-badge"></i>
                </span>
                <span class="min-w-0 flex-grow-1">
                  <span class="quick-action-title d-block">My profile</span>
                  <span class="quick-action-sub d-block">View your posts and followers</span>
                </span>
                <i class="bi bi-chevron-right quick-action-chevron"></i>
              </a>

              <button type="button" class="quick-action" (click)="exploreFromQuickAction()">
                <span class="quick-action-icon quick-action-icon-violet">
                  <i class="bi bi-compass"></i>
                </span>
                <span class="min-w-0 flex-grow-1">
                  <span class="quick-action-title d-block">Explore posts</span>
                  <span class="quick-action-sub d-block">Discover the whole community</span>
                </span>
                <i class="bi bi-chevron-right quick-action-chevron"></i>
              </button>

              @if (isAdmin) {
                <a routerLink="/admin" class="quick-action text-decoration-none">
                  <span class="quick-action-icon quick-action-icon-rose">
                    <i class="bi bi-shield-lock"></i>
                  </span>
                  <span class="min-w-0 flex-grow-1">
                    <span class="quick-action-title d-block">Admin panel</span>
                    <span class="quick-action-sub d-block">Manage users, posts and reports</span>
                  </span>
                  <i class="bi bi-chevron-right quick-action-chevron"></i>
                </a>
              }
            </div>
          </div>
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

    <!-- Edit post in place -->
    <app-edit-post-modal
      #editPostModal
      (updated)="onPostUpdated($event)">
    </app-edit-post-modal>
  `,
  styles: [`
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
  @ViewChild('composerInput') composerInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('feedToolbar') feedToolbar!: ElementRef<HTMLElement>;
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  @ViewChild('reportModal') reportModal!: ReportModalComponent;
  @ViewChild('editPostModal') editPostModal!: EditPostModalComponent;

  posts: PostResponse[] = [];
  suggestedStudents: UserResponse[] = [];
  likedPostIds = new Set<number>();
  likeCounts = new Map<number, number>();
  likeLoadingPostIds = new Set<number>();
  isDiscoveryMode = false;
  currentUsername = '';
  currentAvatarUrl: string | null = null;
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
  isAdmin = false;

  constructor(
    public postsService: PostsService,
    public usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.currentUsername = this.authService.getUsername();
    this.isAdmin = this.authService.getRole() === 'ROLE_ADMIN';
    this.loadCurrentAvatar();
    this.loadPosts();
    this.loadSuggestedStudents();
  }

  private loadCurrentAvatar(): void {
    if (!this.currentUserId) return;

    this.usersService.getUserById(this.currentUserId).subscribe({
      next: (user) => {
        this.currentAvatarUrl = user.avatarUrl || null;
      },
      error: () => {}
    });
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

  setFeedMode(discovery: boolean): void {
    if (discovery === this.isDiscoveryMode) return;

    if (discovery) {
      this.loading = true;
      this.loadDiscoveryPosts();
    } else {
      this.loadPosts();
    }
  }

  focusComposer(): void {
    this.composerInput?.nativeElement.focus();
    this.composerInput?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  exploreFromQuickAction(): void {
    this.setFeedMode(true);
    this.feedToolbar?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    this.editPostModal.show(post);
  }

  onPostUpdated(updated: PostResponse): void {
    this.posts = this.posts.map((post) => (post.id === updated.id ? updated : post));
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
        this.confirmModal.dismiss();
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
