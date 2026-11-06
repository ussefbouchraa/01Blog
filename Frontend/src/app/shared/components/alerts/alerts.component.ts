// Purpose: Alert container component.
// Renders the stack of notifications from NotificationService as Bootstrap toasts.
import { Component } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1090">
      @for (alert of notifications.alerts(); track alert.id) {
        <div class="toast align-items-center text-bg-{{ alert.type }} border-0 show"
             role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body">{{ alert.message }}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    aria-label="Close" (click)="notifications.dismiss(alert.id)"></button>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class AlertsComponent {
  constructor(public notifications: NotificationService) {}
}
