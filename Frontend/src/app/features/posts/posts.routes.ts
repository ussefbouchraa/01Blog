// Purpose: Route definitions for posts feature.
// /posts/:id → view a single post
//
// Note: The main feed lives at /home (see app.routes.ts).
// Creating and editing posts are handled in place by modals, so no extra routes are needed.
import { Routes } from '@angular/router';

export const POSTS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./post-detail/post-detail.component').then(m => m.PostDetailComponent)
  }
];
