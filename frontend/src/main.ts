// Purpose: Application bootstrap file.
// Bootstraps the standalone Angular app using AppComponent and appConfig (routes, providers, interceptors).
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
