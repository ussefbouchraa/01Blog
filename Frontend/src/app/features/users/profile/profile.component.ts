// Purpose: User profile page component (User Block page).
// Displays public user profile, follower/following metrics, social follow/unfollow toggle,
// and lists all posts published by this user with management actions for the profile owner.
import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsersService } from '../users.service';
import { PostsService } from '../../posts/posts.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserResponse, PostResponse, SubscriptionResponse, LikeResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { CreatePostModalComponent } from '../../posts/create-post-modal/create-post-modal.component';
import { EditPostModalComponent } from '../../posts/edit-post-modal/edit-post-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingComponent,
    ConfirmModalComponent,
    ReportModalComponent,
    EditProfileModalComponent,
    CreatePostModalComponent,
    EditPostModalComponent
  ],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-9">
        <!-- Loading State -->
        @if (loading) {
          <app-loading message="Loading profile..."></app-loading>
        }

        <!-- Error State -->
        @if (errorMessage && !loading) {
          <div class="alert alert-danger shadow-sm d-flex justify-content-between align-items-center mb-4">
            <div>
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ errorMessage }}
            </div>
            <a routerLink="/home" class="btn btn-sm btn-outline-danger">Return Home</a>
          </div>
        }

        <!-- Profile Content -->
        @if (user && !loading) {
          <!-- User Profile Header Card -->
          <div class="card shadow-sm border-0 mb-4 overflow-hidden">
            <div class="card-body p-4">
              <div class="d-flex flex-column flex-md-row align-items-center align-items-md-start gap-4">
                <!-- Avatar -->
                <div class="text-center">
                  @if (user.avatarUrl) {
                    <img
                      [src]="usersService.getAvatarUrl(user.avatarUrl)"
                      alt="{{ user.username }}'s avatar"
                      class="rounded-circle shadow-sm object-fit-cover"
                      width="100"
                      height="100" />
                  } @else {
                    <div
                      class="bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary shadow-sm"
                      style="width: 100px; height: 100px;">
                      <i class="bi bi-person-fill display-4"></i>
                    </div>
                  }
                </div>

                <!-- User Details -->
                <div class="flex-grow-1 text-center text-md-start">
                  <div class="d-flex flex-column flex-md-row justify-content-between align-items-center align-items-md-start mb-2">
                    <div>
                      <h2 class="h4 fw-bold mb-1 text-dark">{{ user.username }}</h2>
                      <div class="text-muted small">
                        <i class="bi bi-calendar3 me-1"></i>Member since {{ user.createdAt | date:'mediumDate' }}
                      </div>
                    </div>

                    <!-- Profile Actions: Own vs Other User -->
                    <div class="mt-3 mt-md-0 d-flex gap-2">
                      @if (isOwnProfile) {
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                          (click)="openEditProfileModal()">
                          <i class="bi bi-pencil me-1"></i>Edit Profile
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-primary d-inline-flex align-items-center"
                          (click)="openCreatePostModal()">
                          <i class="bi bi-plus-lg me-1"></i>New Post
                        </button>
                      } @else {
                        <!-- Follow / Unfollow Button -->
                        <button
                          type="button"
                          class="btn btn-sm d-inline-flex align-items-center"
                          [ngClass]="isFollowing ? 'btn-outline-danger' : 'btn-primary'"
                          [disabled]="followLoading"
                          (click)="toggleFollow()">
                          @if (followLoading) {
                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                          } @else if (isFollowing) {
                            <i class="bi bi-person-dash me-1"></i>Unfollow
                          } @else {
                            <i class="bi bi-person-plus me-1"></i>Follow
                          }
                        </button>

                        <!-- Report User Button -->
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-warning"
                          title="Report this user"
                          (click)="onReportUser()">
                          <i class="bi bi-flag"></i>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Bio -->
                  <p class="text-secondary mt-2 mb-3 small" style="white-space: pre-line;">
                    {{ user.bio || 'This user has not written a bio yet.' }}
                  </p>

                  <!-- Metrics / Stats Bar -->
                  <div class="d-flex justify-content-center justify-content-md-start gap-4 pt-2 border-top">
                    <div class="text-center text-md-start">
                      <span class="fw-bold fs-6 text-dark d-block">{{ posts.length }}</span>
                      <span class="text-muted small">Posts</span>
                    </div>
                    <div class="text-center text-md-start">
                      <span class="fw-bold fs-6 text-dark d-block">{{ followerCount }}</span>
                      <span class="text-muted small">Followers</span>
                    </div>
                    <div class="text-center text-md-start">
                      <span class="fw-bold fs-6 text-dark d-block">{{ followingCount }}</span>
                      <span class="text-muted small">Following</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User's Posts Section ("User Block") -->
          <div class="mb-4">
            <h3 class="h5 fw-bold mb-3 d-flex align-items-center">
              <i class="bi bi-journal-text me-2 text-primary"></i>
              {{ isOwnProfile ? 'My Published Posts' : user.username + "'s Posts" }}
              <span class="badge bg-secondary bg-opacity-25 text-dark ms-2">{{ posts.length }}</span>
            </h3>

            <!-- Empty Posts State -->
            @if (posts.length === 0) {
              <div class="card border-0 shadow-sm text-center py-5">
                <div class="card-body">
                  <i class="bi bi-file-earmark-text display-5 text-muted mb-2 d-block"></i>
                  <h6 class="fw-bold">No posts published yet</h6>
                  <p class="text-muted small mb-3">
                    {{ isOwnProfile ? "You haven't written any posts yet. Start documenting your journey!" : user.username + ' has not published any posts yet.' }}
                  </p>
                  @if (isOwnProfile) {
                    <button type="button" class="btn btn-sm btn-primary" (click)="openCreatePostModal()">
                      <i class="bi bi-pencil-square me-1"></i>Create Your First Post
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Posts List — same card UI as the home feed -->
            @if (posts.length > 0) {
              <div class="d-flex flex-column gap-3">
                @for (post of posts; track post.id) {
                  <article class="wireframe-card feed-post p-3 p-lg-4" (click)="openPost($event, post)">
                    <!-- Post header -->
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <div class="d-flex align-items-center gap-2 min-w-0">
                        <a [routerLink]="['/users', post.author.id]" class="text-decoration-none flex-shrink-0">
                          @if (post.author.avatarUrl) {
                            <img
                              [src]="postsService.getMediaUrl(post.author.avatarUrl)"
                              alt="{{ post.author.username }}'s avatar"
                              class="post-avatar"
                              width="36"
                              height="36" />
                          } @else {
                            <span class="post-avatar post-avatar-placeholder d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                              <i class="bi bi-person-fill"></i>
                            </span>
                          }
                        </a>
                        <div class="min-w-0">
                          <a [routerLink]="['/users', post.author.id]" class="post-author d-block text-truncate">
                            {{ post.author.username }}
                          </a>
                          <span class="post-time"><i class="bi bi-clock me-1"></i>{{ formatTimeAgo(post.createdAt) }}</span>
                        </div>
                      </div>

                      <!-- Post actions dropdown -->
                      <div class="dropdown post-menu">
                        <button
                          type="button"
                          class="btn btn-sm feed-more"
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

                    <!-- Post content -->
                    <p class="post-content mb-3 text-break">{{ post.content }}</p>

                    <!-- Post media -->
                    @if (post.mediaUrl) {
                      <div class="feed-media mb-3">
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

                    <!-- Actions -->
                    <div class="feed-actions">
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
          </div>
        }

        <!-- Confirmation Modal for Deleting Post -->
        <app-confirm-modal
          #confirmModal
          title="Delete Post"
          message="Are you sure you want to delete this post? This cannot be undone."
          confirmText="Delete"
          [loading]="deleteLoading"
          (confirmed)="onConfirmDeletePost()">
        </app-confirm-modal>

        <!-- Report Modal for reporting another user -->
        <app-report-modal
          #reportModal
          [reportedUserId]="reportTargetUserId"
          [reportedPostId]="reportTargetPostId">
        </app-report-modal>

        <!-- In-page profile editing and post creation -->
        <app-edit-profile-modal
          #editProfileModal
          (saved)="onProfileUpdated()">
        </app-edit-profile-modal>

        <app-create-post-modal
          #createPostModal
          (created)="onPostCreated()">
        </app-create-post-modal>

        <!-- Edit post in place -->
        <app-edit-post-modal
          #editPostModal
          (updated)="onPostUpdated($event)">
        </app-edit-post-modal>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  @ViewChild('reportModal') reportModal!: ReportModalComponent;
  @ViewChild('editProfileModal') editProfileModal!: EditProfileModalComponent;
  @ViewChild('createPostModal') createPostModal!: CreatePostModalComponent;
  @ViewChild('editPostModal') editPostModal!: EditPostModalComponent;

  user: UserResponse | null = null;
  posts: PostResponse[] = [];
  followers: SubscriptionResponse[] = [];
  following: SubscriptionResponse[] = [];

  followerCount = 0;
  followingCount = 0;
  isFollowing = false;
  followLoading = false;

  loading = true;
  errorMessage = '';

  currentUserId: number | null = null;
  isAdmin = false;
  isOwnProfile = false;

  pendingDeletePostId: number | null = null;
  deleteLoading = false;

  openMenuPostId: number | null = null;
  likedPostIds = new Set<number>();
  likeCounts = new Map<number, number>();
  likeLoadingPostIds = new Set<number>();
  reportTargetUserId: number | null = null;
  reportTargetPostId: number | null = null;

  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public usersService: UsersService,
    public postsService: PostsService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.isAdmin = this.authService.getRole() === 'ROLE_ADMIN';

    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.currentUserId = this.authService.getUserId();
      const rawId = params.get('id');

      // Resolve 'me' if directly hit (e.g. /users/me without redirect)
      const targetId =
        !rawId || rawId === 'me'
          ? this.currentUserId
          : Number(rawId);

      if (!targetId || isNaN(targetId)) {
        this.errorMessage = 'Invalid user ID.';
        this.loading = false;
        return;
      }

      this.isOwnProfile = this.currentUserId !== null && this.currentUserId === targetId;
      this.loadUserProfile(targetId);
    });
  }

  loadUserProfile(userId: number): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      profile: this.usersService.getUserById(userId),
      posts: this.usersService.getUserPosts(userId).pipe(
        catchError((err) => {
          console.error('Failed to load user posts:', err);
          return of([] as PostResponse[]);
        })
      ),
      followers: this.usersService.getFollowers(userId).pipe(
        catchError((err) => {
          console.error('Failed to load followers:', err);
          return of([] as SubscriptionResponse[]);
        })
      ),
      following: this.usersService.getFollowing(userId).pipe(
        catchError((err) => {
          console.error('Failed to load following:', err);
          return of([] as SubscriptionResponse[]);
        })
      )
    }).subscribe({
      next: ({ profile, posts, followers, following }) => {
        this.user = profile;
        this.posts = posts || [];
        this.followers = followers || [];
        this.following = following || [];

        this.followerCount = this.followers.length;
        this.followingCount = this.following.length;

        // Check if current user is among the followers
        this.isFollowing = this.followers.some(
          (sub) => sub.subscriber?.id === this.currentUserId
        );

        this.loadLikesForPosts(this.posts);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.status === 404
            ? 'User not found.'
            : err.error?.message || 'Failed to load user profile.';
      }
    });
  }

  toggleFollow(): void {
    if (!this.user || this.followLoading || this.isOwnProfile) return;

    const targetUserId = this.user.id;
    const previousState = this.isFollowing;
    const previousCount = this.followerCount;

    // Optimistic UI update
    this.isFollowing = !previousState;
    this.followerCount = this.isFollowing
      ? previousCount + 1
      : Math.max(0, previousCount - 1);
    this.followLoading = true;

    if (!previousState) {
      // Follow action
      this.usersService.follow(targetUserId).subscribe({
        next: () => {
          this.followLoading = false;
          this.notificationService.success(`You are now following ${this.user?.username}`);
        },
        error: (err) => {
          // Rollback
          this.isFollowing = previousState;
          this.followerCount = previousCount;
          this.followLoading = false;
          this.notificationService.error(
            err.error?.message || 'Failed to follow user.'
          );
        }
      });
    } else {
      // Unfollow action
      this.usersService.unfollow(targetUserId).subscribe({
        next: () => {
          this.followLoading = false;
          this.notificationService.info(`Unfollowed ${this.user?.username}`);
        },
        error: (err) => {
          // Rollback
          this.isFollowing = previousState;
          this.followerCount = previousCount;
          this.followLoading = false;
          this.notificationService.error(
            err.error?.message || 'Failed to unfollow user.'
          );
        }
      });
    }
  }

  promptDeletePost(post: PostResponse): void {
    this.closeMenu();
    if (this.deleteLoading) return;
    this.pendingDeletePostId = post.id;
    this.confirmModal.open();
  }

  onConfirmDeletePost(): void {
    if (!this.pendingDeletePostId || this.deleteLoading) return;

    const postId = this.pendingDeletePostId;
    this.deleteLoading = true;

    this.postsService.deletePost(postId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.posts = this.posts.filter((p) => p.id !== postId);
        this.confirmModal.dismiss();
        this.notificationService.success('Post deleted successfully.');
        this.pendingDeletePostId = null;
      },
      error: (err) => {
        this.deleteLoading = false;
        this.notificationService.error(err.error?.message || 'Failed to delete post.');
      }
    });
  }

  onReportUser(): void {
    if (!this.user || this.isOwnProfile) return;
    this.reportTargetPostId = null;
    this.reportTargetUserId = this.user.id;
    this.reportModal.show();
  }

  openEditProfileModal(): void {
    this.editProfileModal.show();
  }

  openCreatePostModal(): void {
    this.createPostModal.show();
  }

  onProfileUpdated(): void {
    this.reloadProfile();
  }

  onPostCreated(): void {
    this.reloadProfile();
  }

  private reloadProfile(): void {
    const id = this.user?.id ?? this.currentUserId;
    if (id) {
      this.loadUserProfile(id);
    }
  }

  // --- Feed-style post cards ---------------------------------------------

  // Clicking the card opens the post; nested controls keep their own behaviour.
  openPost(event: MouseEvent, post: PostResponse): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button, video, input, textarea, select, .dropdown-menu')) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    this.router.navigate(['/posts', post.id]);
  }

  toggleMenu(event: Event, post: PostResponse): void {
    event.stopPropagation();
    this.openMenuPostId = this.openMenuPostId === post.id ? null : post.id;
  }

  closeMenu(): void {
    this.openMenuPostId = null;
  }

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
    this.reportTargetUserId = null;
    this.reportTargetPostId = post.id;
    this.reportModal.show();
  }

  toggleLike(post: PostResponse): void {
    if (this.isLikeLoading(post.id)) return;

    const wasLiked = this.isPostLiked(post.id);
    const previousCount = this.getLikeCount(post.id);

    this.setPostLiked(post.id, !wasLiked);
    this.setLikeCount(post.id, wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1);
    this.setLikeLoading(post.id, true);

    if (wasLiked) {
      this.postsService.unlikePost(post.id).subscribe({
        next: () => this.setLikeLoading(post.id, false),
        error: (err) => {
          this.setPostLiked(post.id, wasLiked);
          this.setLikeCount(post.id, previousCount);
          this.setLikeLoading(post.id, false);
          this.notificationService.error(err.error?.message || 'Could not unlike post.');
        }
      });
    } else {
      this.postsService.likePost(post.id).subscribe({
        next: () => this.setLikeLoading(post.id, false),
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
        if (this.currentUserId !== null && likes.some((like) => like.user?.id === this.currentUserId)) {
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

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}
