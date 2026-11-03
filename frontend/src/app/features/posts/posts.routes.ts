// Purpose: Route definitions for posts feature.
// Maps post list, detail, create, and edit pages.
import { Routes } from '@angular/router';

export const POSTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./post-list/post-list.component').then(m => m.PostListComponent) },
  { path: 'create', loadComponent: () => import('./create-post/create-post.component').then(m => m.CreatePostComponent) },
  { path: ':id', loadComponent: () => import('./post-detail/post-detail.component').then(m => m.PostDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./edit-post/edit-post.component').then(m => m.EditPostComponent) }
];
