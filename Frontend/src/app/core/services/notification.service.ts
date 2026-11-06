// Purpose: Global notification service.
// Holds a list of alert messages (success/error/warning/info) rendered by <app-alerts>.
import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

export interface Alert {
  id: number;
  type: AlertType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly alertsSignal = signal<Alert[]>([]);
  readonly alerts = this.alertsSignal.asReadonly();
  private nextId = 1;

  show(message: string, type: AlertType = 'info'): void {
    const alert: Alert = { id: this.nextId++, type, message };
    this.alertsSignal.update(list => [...list, alert]);
    setTimeout(() => this.dismiss(alert.id), 5000);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'danger');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  dismiss(id: number): void {
    this.alertsSignal.update(list => list.filter(a => a.id !== id));
  }
}
