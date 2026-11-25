// Purpose: Reusable report submission modal.
// Two-step flow: reason form → confirmation → POST /api/reports.
// Target is provided by the parent through reportedUserId and/or reportedPostId.
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportRequest, ReportResponse } from '../../../core/models';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        style="background-color: rgba(0, 0, 0, 0.5); z-index: 1055;"
        (click)="onBackdropClick($event)">
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content shadow border-0" style="border-radius: 12px;">
            <!-- Header -->
            <div class="modal-header border-0 pb-0 px-4 pt-4">
              <h5 class="modal-title fw-bold text-danger d-flex align-items-center">
                <i class="bi bi-flag-fill me-2"></i>Report {{ targetKind }}
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                [disabled]="submitting"
                (click)="close()"></button>
            </div>

            <div class="modal-body px-4 pb-3 pt-3">
              <!-- Step 1: Reason -->
              @if (step === 'form') {
                <p class="text-secondary small mb-3">
                  Tell our moderators what is wrong with this {{ targetKind }}. Reports are
                  reviewed by administrators.
                </p>

                <label for="reportReason" class="form-label fw-semibold">
                  Why are you reporting it?
                </label>
                <textarea
                  id="reportReason"
                  class="form-control"
                  rows="4"
                  placeholder="Describe the problem…"
                  maxlength="1000"
                  [(ngModel)]="reason"
                  [disabled]="submitting"></textarea>

                <div class="d-flex justify-content-between align-items-center mt-1">
                  <span class="small" [class.text-danger]="reason.trim().length > 0 && reason.trim().length < 10">
                    {{ reason.trim().length < 10 ? 'At least 10 characters required.' : 'Looks good.' }}
                  </span>
                  <span class="text-muted small">{{ reason.length }}/1000</span>
                </div>

                @if (error) {
                  <div class="alert alert-danger py-2 small mt-2 mb-0" role="alert">{{ error }}</div>
                }
              } @else {
                <!-- Step 2: Confirmation -->
                <div class="alert alert-warning py-2 small d-flex align-items-start mb-3" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                  <span>
                    Please confirm the details below. False reports may lead to restrictions on
                    your account.
                  </span>
                </div>

                <dl class="mb-0">
                  <dt class="small text-muted">Reporting</dt>
                  <dd class="fw-semibold mb-2">{{ targetKind }} #{{ targetId }}</dd>

                  <dt class="small text-muted">Reason</dt>
                  <dd class="mb-0">
                    <div class="bg-light rounded p-2 small text-break" style="white-space: pre-line;">{{ reason.trim() }}</div>
                  </dd>
                </dl>

                @if (error) {
                  <div class="alert alert-danger py-2 small mt-3 mb-0" role="alert">{{ error }}</div>
                }
              }
            </div>

            <!-- Footer -->
            <div class="modal-footer border-0 pt-0 px-4 pb-4">
              @if (step === 'form') {
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  [disabled]="submitting"
                  (click)="close()">
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-danger d-inline-flex align-items-center"
                  [disabled]="!isValid()"
                  (click)="goToConfirm()">
                  Continue<i class="bi bi-arrow-right ms-2"></i>
                </button>
              } @else {
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  [disabled]="submitting"
                  (click)="step = 'form'; error = ''">
                  <i class="bi bi-arrow-left me-1"></i>Back
                </button>
                <button
                  type="button"
                  class="btn btn-danger d-inline-flex align-items-center"
                  [disabled]="submitting"
                  (click)="submitReport()">
                  @if (submitting) {
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  } @else {
                    <i class="bi bi-flag me-1"></i>
                  }
                  Submit Report
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class ReportModalComponent {
  @Input() reportedUserId: number | null = null;
  @Input() reportedPostId: number | null = null;

  isOpen = false;
  step: 'form' | 'confirm' = 'form';
  reason = '';
  error = '';
  submitting = false;

  constructor(
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  get targetKind(): string {
    return this.reportedPostId != null ? 'post' : 'user';
  }

  get targetId(): number | null {
    return this.reportedPostId ?? this.reportedUserId;
  }

  show(): void {
    this.step = 'form';
    this.reason = '';
    this.error = '';
    this.submitting = false;
    this.isOpen = true;
  }

  // Backward-compatible alias, matching ConfirmModalComponent.
  open(): void {
    this.show();
  }

  close(): void {
    if (this.submitting) return;
    this.isOpen = false;
  }

  isValid(): boolean {
    return this.targetId != null && this.reason.trim().length >= 10;
  }

  goToConfirm(): void {
    if (!this.isValid()) return;
    this.error = '';
    this.step = 'confirm';
  }

  submitReport(): void {
    if (!this.isValid() || this.submitting) return;

    const request: ReportRequest = {
      reason: this.reason.trim()
    };
    if (this.reportedPostId != null) {
      request.reportedPostId = this.reportedPostId;
    } else {
      request.reportedUserId = this.reportedUserId;
    }

    this.error = '';
    this.submitting = true;

    this.api.post<ReportResponse>('/reports', request).subscribe({
      next: () => {
        this.submitting = false;
        this.isOpen = false;
        this.notificationService.success('Report submitted. Thank you for helping keep 01Blog safe.');
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Could not submit your report. Please try again.';
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }
}
