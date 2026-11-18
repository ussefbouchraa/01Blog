// Purpose: Route definitions for posts feature.
// /posts/create        → create a new post
// /posts/:id          → view a single post
// /posts/:id/edit     → edit an existing post
//
// Note: The main feed lives at /home (see app.routes.ts).
// This file covers only post-operation routes.
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const POSTS_ROUTES: Routes = [
  {
    path: 'create',
    canActivate: [authGuard],
    loadComponent: () => import('./create-post/create-post.component').then(m => m.CreatePostComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./post-detail/post-detail.component').then(m => m.PostDetailComponent)
  },
  {
    path: ':id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./edit-post/edit-post.component').then(m => m.EditPostComponent)
  }
];
