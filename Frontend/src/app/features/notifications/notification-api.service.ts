// Purpose: API access for the authenticated user's notifications.
// This is separate from core/services/notification.service.ts, which displays toast alerts.
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  constructor(private api: ApiService) {}

  getAll(): Observable<NotificationResponse[]> {
    return this.api.get<NotificationResponse[]>('/notifications');
  }

  getUnread(): Observable<NotificationResponse[]> {
    return this.api.get<NotificationResponse[]>('/notifications/unread');
  }

  getUnreadCount(): Observable<number> {
    return this.api.get<number>('/notifications/unread-count');
  }

  markAsRead(id: number): Observable<void> {
    return this.api.patch<void>(`/notifications/${id}/read`, {});
  }
}
