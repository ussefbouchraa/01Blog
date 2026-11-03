// Purpose: Root component of the application.
// Acts as the shell, rendering the navbar, router outlet for feature pages, and footer.
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <!-- Navbar will be added here later -->
    <main>
      <router-outlet></router-outlet>
    </main>
    <!-- Footer will be added here later -->
  `,
  styles: []
})
export class AppComponent {
  title = '01Blog';
}
