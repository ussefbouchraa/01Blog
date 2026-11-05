// Purpose: Route definitions for users feature.
// Maps profile and edit-profile pages for viewing/updating user data.
import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  { path: ':id', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'me/edit', loadComponent: () => import('./edit-profile/edit-profile.component').then(m => m.EditProfileComponent) }
];
