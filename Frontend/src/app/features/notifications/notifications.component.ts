// Purpose: Notifications feature — placeholder stub.
// This component will be fully implemented in Task 5.2.
// It exists now so the /notifications route resolves without crashing.
import { Component } from '@angular/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div class="d-flex flex-column align-items-center text-center py-5">
      <i class="bi bi-bell display-3 text-secondary mb-3"></i>
      <h4 class="text-muted">Notifications — Coming Soon</h4>
      <p class="text-secondary small">This section will show your activity notifications.</p>
    </div>
  `,
  styles: []
})
export class NotificationsComponent {}
