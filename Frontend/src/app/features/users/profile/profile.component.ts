// Purpose: User profile page component (User Block page).
// Displays public user profile, follower/following metrics, social follow/unfollow toggle,
// and lists all posts published by this user with management actions for the profile owner.
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsersService } from '../users.service';
import { PostsService } from '../../posts/posts.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserResponse, PostResponse, SubscriptionResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, ConfirmModalComponent, ReportModalComponent],
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
                        <a routerLink="/users/me/edit" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center">
                          <i class="bi bi-pencil me-1"></i>Edit Profile
                        </a>
                        <a routerLink="/posts/create" class="btn btn-sm btn-primary d-inline-flex align-items-center">
                          <i class="bi bi-plus-lg me-1"></i>New Post
                        </a>
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
                    <a routerLink="/posts/create" class="btn btn-sm btn-primary">
                      <i class="bi bi-pencil-square me-1"></i>Create Your First Post
                    </a>
                  }
                </div>
              </div>
            }

            <!-- Posts List -->
            @if (posts.length > 0) {
              <div class="d-flex flex-column gap-3">
                @for (post of posts; track post.id) {
                  <article class="card shadow-sm border-0">
                    <div class="card-body p-3">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small">
                          <i class="bi bi-clock me-1"></i>{{ post.createdAt | date:'mediumDate' }}
                        </span>

                        <!-- Action controls for own posts -->
                        @if (isOwnProfile || isAdmin) {
                          <div class="btn-group btn-group-sm">
                            <a [routerLink]="['/posts', post.id, 'edit']" class="btn btn-outline-secondary btn-sm" title="Edit post">
                              <i class="bi bi-pencil"></i>
                            </a>
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              title="Delete post"
                              (click)="promptDeletePost(post.id)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        }
                      </div>

                      <p class="card-text text-dark mb-3 text-break" style="white-space: pre-line;">{{ post.content }}</p>

                      <!-- Media Thumbnail (if post has attachment) -->
                      @if (post.mediaUrl) {
                        <div class="rounded overflow-hidden bg-light mb-3 text-center" style="max-height: 300px;">
                          @if (isImageMedia(post.mediaType)) {
                            <img
                              [src]="postsService.getMediaUrl(post.mediaUrl)"
                              alt="Attachment"
                              class="img-fluid rounded"
                              style="max-height: 300px; width: 100%; object-fit: cover;"
                              loading="lazy" />
                          } @else if (isVideoMedia(post.mediaType)) {
                            <video
                              [src]="postsService.getMediaUrl(post.mediaUrl)"
                              controls
                              class="w-100 rounded"
                              style="max-height: 300px;">
                            </video>
                          }
                        </div>
                      }

                      <!-- Post Footer Link -->
                      <div class="d-flex justify-content-end pt-2 border-top">
                        <a [routerLink]="['/posts', post.id]" class="btn btn-sm btn-link text-decoration-none p-0 fw-semibold">
                          View details <i class="bi bi-arrow-right small"></i>
                        </a>
                      </div>
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
          [reportedUserId]="user?.id ?? null"
          [reportedPostId]="null">
        </app-report-modal>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  @ViewChild('reportModal') reportModal!: ReportModalComponent;

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

  promptDeletePost(postId: number): void {
    this.pendingDeletePostId = postId;
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
        this.confirmModal.close();
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
    this.reportModal.show();
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
