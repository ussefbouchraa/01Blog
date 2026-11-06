// Purpose: Loading indicator component.
// Used to show spinners/loaders during API calls or async operations.
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="d-flex flex-column justify-content-center align-items-center py-5"
         role="status" aria-live="polite">
      <div class="spinner-border text-primary" role="presentation">
        <span class="visually-hidden">Loading...</span>
      </div>
      @if (message) {
        <span class="mt-3 text-muted">{{ message }}</span>
      }
    </div>
  `,
  styles: []
})
export class LoadingComponent {
  @Input() message = 'Loading...';
}
