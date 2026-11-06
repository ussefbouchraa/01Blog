// Purpose: Footer component.
// Displays copyright, project info, or additional links at the bottom of the page.

import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-dark text-light py-3 mt-auto">
      <div class="container d-flex flex-wrap justify-content-between align-items-center">
        <span class="fw-bold">01Blog</span>
        <span class="text-secondary">&copy; {{ currentYear }} 01Blog. All rights reserved.</span>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
