// Purpose: Admin — manage reports tab.
// Lists all submitted reports with their status and lets an admin mark a pending
// report as resolved.
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
    <div class="card shadow-sm border-0">
      <div class="card-header bg-white border-0 pt-3 px-4 d-flex align-items-center justify-content-between">
        <h5 class="fw-bold mb-0">
          <i class="bi bi-flag me-2 text-primary"></i>All Reports
          <span class="badge bg-secondary ms-1">{{ reports.length }}</span>
          @if (pendingCount() > 0) {
            <span class="badge bg-warning text-dark ms-1">{{ pendingCount() }} pending</span>
          }
        </h5>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
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
          <div class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
            <span><i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error }}</span>
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="loadReports()">Retry</button>
          </div>
        }

        @if (!loading && !error && reports.length === 0) {
          <div class="text-center py-4">
            <i class="bi bi-shield-check display-6 text-success d-block mb-2"></i>
            <p class="text-muted mb-0">No reports have been submitted yet.</p>
          </div>
        }

        @if (!loading && !error && reports.length > 0) {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr class="text-muted small text-uppercase">
                  <th scope="col">ID</th>
                  <th scope="col">Reporter</th>
                  <th scope="col">Reported User</th>
                  <th scope="col">Post</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date</th>
                  <th scope="col" class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (report of reports; track report.id) {
                  <tr>
                    <td class="text-muted">{{ report.id }}</td>
                    <td class="fw-semibold small">{{ report.reporter.username || '—' }}</td>
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
                      @if (isPending(report)) {
                        <span class="badge bg-warning text-dark">Pending</span>
                      } @else {
                        <span class="badge bg-success">Resolved</span>
                      }
                    </td>
                    <td class="text-muted small text-nowrap">{{ report.createdAt | date:'mediumDate' }}</td>
                    <td class="text-end">
                      @if (isPending(report)) {
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-success"
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

  pendingCount(): number {
    return this.reports.filter((report) => this.isPending(report)).length;
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
