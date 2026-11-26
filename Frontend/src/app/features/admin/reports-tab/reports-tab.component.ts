// Purpose: Admin — review reports.
// GET /api/admin/reports · PATCH /api/admin/reports/{id}/resolve
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-reports-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  template: `
    <div class="card adm-card adm-card-reports">
      <div class="adm-card-head">
        <h5 class="adm-card-title">
          <span class="adm-icon-tile adm-tile-reports"><i class="bi bi-flag-fill"></i></span>
          Reports
          @if (pendingCount > 0) {
            <span class="badge bg-warning text-dark adm-count ms-1">{{ pendingCount }} pending</span>
          }
        </h5>
        <button
          type="button"
          class="btn btn-sm adm-btn"
          [disabled]="loading"
          (click)="loadReports()">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>
      <div class="card-body px-4 pb-4 pt-3">
        @if (loading) {
          <app-loading message="Loading reports..."></app-loading>
        }
        @if (error && !loading) {
          <div class="alert alert-danger d-flex align-items-center justify-content-between mb-0" role="alert">
            <span><i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error }}</span>
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="loadReports()">Retry</button>
          </div>
        }
        @if (!loading && !error && reports.length === 0) {
          <div class="adm-empty">
            <i class="bi bi-shield-check display-4 text-success"></i>
            <p>No reports have been submitted yet.</p>
          </div>
        }
        @if (!loading && !error && reports.length > 0) {
          <div class="table-responsive">
            <table class="table adm-table align-middle mb-0">
              <thead>
                <tr class="text-muted small text-uppercase">
                  <th>Reported user</th>
                  <th>Post</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (report of reports; track report.id) {
                  <tr>
                    <td class="small">
                      @if (report.reportedUser) {
                        <a [routerLink]="['/users', report.reportedUser.id]" class="text-decoration-none">
                          {{ report.reportedUser.username }}
                        </a>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td class="small">
                      @if (report.reportedPostId) {
                        <a [routerLink]="['/posts', report.reportedPostId]" class="text-decoration-none">
                          #{{ report.reportedPostId }}
                        </a>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td class="small text-break" style="max-width: 280px;">{{ report.reason }}</td>
                    <td>
                      <span class="badge adm-badge" [ngClass]="isPending(report) ? 'bg-warning text-dark' : 'bg-success'">
                        {{ isPending(report) ? 'Pending' : 'Resolved' }}
                      </span>
                    </td>
                    <td class="text-muted small text-nowrap">{{ report.createdAt | date:'mediumDate' }}</td>
                    <td class="text-end">
                      @if (isPending(report)) {
                        <button
                          type="button"
                          class="btn btn-sm adm-btn adm-success"
                          [disabled]="resolvingId === report.id"
                          (click)="resolveReport(report)">
                          @if (resolvingId === report.id) {
                            <span class="spinner-border spinner-border-sm" role="status"></span>
                          } @else {
                            <i class="bi bi-check2 me-1"></i>Resolve
                          }
                        </button>
                      } @else {
                        <span class="text-muted small">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ReportsTabComponent implements OnInit {
  reports: ReportResponse[] = [];
  loading = true;
  error = '';
  resolvingId: number | null = null;

  constructor(
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  get pendingCount(): number {
    return this.reports.filter((report) => this.isPending(report)).length;
  }

  loadReports(): void {
    this.loading = true;
    this.error = '';
    this.api.get<ReportResponse[]>('/admin/reports').subscribe({
      next: (reports) => {
        this.reports = reports || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Could not load reports.';
      }
    });
  }

  isPending(report: ReportResponse): boolean {
    return (report.status || '').toLowerCase() === 'pending';
  }

  resolveReport(report: ReportResponse): void {
    if (this.resolvingId !== null) return;

    this.resolvingId = report.id;
    this.api.patch<ReportResponse>(`/admin/reports/${report.id}/resolve`, {}).subscribe({
      next: (updated) => {
        this.reports = this.reports.map((item) => (item.id === updated.id ? updated : item));
        this.resolvingId = null;
        this.notificationService.success(`Report #${report.id} resolved.`);
      },
      error: (err) => {
        this.resolvingId = null;
        this.notificationService.error(err.error?.message || 'Could not resolve report.');
      }
    });
  }
}
