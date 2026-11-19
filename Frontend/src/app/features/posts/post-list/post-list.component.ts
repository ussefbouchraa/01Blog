// Purpose: Post list / Feed component.
// Implements hybrid feed (user subscriptions feed with fallback to discovery posts when feed is empty).
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostsService } from '../posts.service';
import { PostResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- Page Title & Actions -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="h3 fw-bold mb-1">
              @if (isDiscoveryMode) {
                <i class="bi bi-compass me-2 text-primary"></i>Discover Posts
              } @else {
                <i class="bi bi-card-text me-2 text-primary"></i>Your Feed
              }
            </h2>
            <p class="text-muted small mb-0">
              @if (isDiscoveryMode) {
                Recent updates from the 01Blog community.
              } @else {
                Latest posts from writers you follow.
              }
            </p>
          </div>
          <a routerLink="/posts/create" class="btn btn-primary d-inline-flex align-items-center shadow-sm">
            <i class="bi bi-plus-lg me-1"></i>New Post
          </a>
        </div>

        <!-- Discovery Mode Banner -->
        @if (isDiscoveryMode && !loading && !errorMessage) {
          <div class="alert alert-info d-flex align-items-start mb-4 shadow-sm" role="alert">
            <i class="bi bi-info-circle-fill me-2 fs-5 flex-shrink-0 mt-1"></i>
            <div>
              <div class="fw-semibold">You're not following anyone yet!</div>
              <div class="small text-secondary">
                Follow other creators to personalize your feed. In the meantime, enjoy these community posts.
              </div>
            </div>
          </div>
        }

        <!-- Loading State -->
        @if (loading) {
          <app-loading message="Loading posts..."></app-loading>
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

        <!-- Empty Feed (No posts even in discovery) -->
        @if (!loading && !errorMessage && posts.length === 0) {
          <div class="card border-0 shadow-sm text-center py-5">
            <div class="card-body">
              <i class="bi bi-journal-x display-4 text-muted mb-3 d-block"></i>
              <h5 class="fw-bold">No posts available</h5>
              <p class="text-muted small mb-3">Be the first writer to publish a post on 01Blog!</p>
              <a routerLink="/posts/create" class="btn btn-primary">
                <i class="bi bi-pencil-square me-1"></i>Create First Post
              </a>
            </div>
          </div>
        }

        <!-- Posts List -->
        @if (!loading && posts.length > 0) {
          <div class="d-flex flex-column gap-4">
            @for (post of posts; track post.id) {
              <article class="card shadow-sm border-0 overflow-hidden">
                <!-- Post Header: Author info -->
                <div class="card-header bg-white border-0 pt-3 pb-2 px-3 d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <a [routerLink]="['/users', post.author.id]" class="text-decoration-none me-2">
                      @if (post.author.avatarUrl) {
                        <img
                          [src]="postsService.getMediaUrl(post.author.avatarUrl)"
                          alt="{{ post.author.username }}'s avatar"
                          class="rounded-circle object-fit-cover"
                          width="42"
                          height="42" />
                      } @else {
                        <i class="bi bi-person-circle fs-2 text-secondary"></i>
                      }
                    </a>
                    <div>
                      <a [routerLink]="['/users', post.author.id]" class="fw-semibold text-dark text-decoration-none d-block">
                        {{ post.author.username }}
                      </a>
                      <span class="text-muted small">
                        <i class="bi bi-clock me-1"></i>{{ post.createdAt | date:'mediumDate' }}
                      </span>
                    </div>
                  </div>

                  <a [routerLink]="['/posts', post.id]" class="btn btn-sm btn-outline-secondary" title="View details">
                    <i class="bi bi-arrow-right"></i>
                  </a>
                </div>

                <!-- Post Body: Content -->
                <div class="card-body pt-1 pb-3 px-3">
                  <p class="card-text text-dark mb-3 text-break" style="white-space: pre-line;">{{ post.content }}</p>

                  <!-- Media Display (Image or Video) -->
                  @if (post.mediaUrl) {
                    <div class="rounded overflow-hidden bg-light mb-2 text-center">
                      @if (isImageMedia(post.mediaType)) {
                        <img
                          [src]="postsService.getMediaUrl(post.mediaUrl)"
                          alt="Post attachment"
                          class="img-fluid rounded"
                          style="max-height: 480px; width: 100%; object-fit: cover;"
                          loading="lazy" />
                      } @else if (isVideoMedia(post.mediaType)) {
                        <video
                          [src]="postsService.getMediaUrl(post.mediaUrl)"
                          controls
                          class="w-100 rounded"
                          style="max-height: 480px;">
                          Your browser does not support the video tag.
                        </video>
                      }
                    </div>
                  }
                </div>

                <!-- Post Footer: Action / Discussion Link -->
                <div class="card-footer bg-light bg-opacity-50 border-top py-2 px-3 d-flex justify-content-between align-items-center">
                  <span class="text-muted small">
                    <i class="bi bi-chat-dots me-1"></i>Discussion & interactions
                  </span>
                  <a [routerLink]="['/posts', post.id]" class="btn btn-sm btn-link text-decoration-none p-0 fw-semibold">
                    Read more & interact <i class="bi bi-chevron-right small"></i>
                  </a>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class PostListComponent implements OnInit {
  posts: PostResponse[] = [];
  isDiscoveryMode = false;
  loading = true;
  errorMessage = '';

  constructor(public postsService: PostsService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.isDiscoveryMode = false;

    // 1. First attempt to load personal feed from followed creators
    this.postsService.getFeed().subscribe({
      next: (feed) => {
        if (feed && feed.length > 0) {
          this.posts = feed;
          this.isDiscoveryMode = false;
          this.loading = false;
        } else {
          // Feed is empty (user follows no one or no new posts): load discovery posts
          this.loadDiscoveryPosts();
        }
      },
      error: (err) => {
        // Do NOT fall back to discovery on server error (Q2 decision rule)
        this.loading = false;
        this.errorMessage =
          err.status === 0
            ? 'Cannot reach the backend service. Please ensure the server is running.'
            : err.error?.message || 'Failed to load your feed. Please try again.';
      }
    });
  }

  private loadDiscoveryPosts(): void {
    this.postsService.getAllPosts().subscribe({
      next: (allPosts) => {
        this.posts = allPosts || [];
        this.isDiscoveryMode = true;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load discovery posts.';
      }
    });
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
