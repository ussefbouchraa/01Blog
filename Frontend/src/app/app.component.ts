// Purpose: Root component of the application.
// Acts as the shell, rendering the navbar, router outlet for feature pages, and footer.
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AlertsComponent } from './shared/components/alerts/alerts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, AlertsComponent],
  template: `
    <app-alerts></app-alerts>
    <div class="d-flex flex-column min-vh-100">
      <app-navbar></app-navbar>
      <main class="container py-4 flex-grow-1">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: []
})
export class AppComponent {
  title = '01Blog';
}
