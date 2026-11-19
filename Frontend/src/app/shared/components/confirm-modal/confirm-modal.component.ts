// Purpose: Reusable confirmation modal component.
// Used for destructive actions (deleting posts, comments, users, etc.) with confirmation dialog.
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
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
          <div class="modal-content shadow border-0">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title fw-bold text-danger d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ title }}
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                [disabled]="loading"
                (click)="close()"></button>
            </div>
            <div class="modal-body py-3">
              <p class="mb-0 text-secondary">{{ message }}</p>
            </div>
            <div class="modal-footer border-0 pt-0">
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="loading"
                (click)="close()">
                {{ cancelText }}
              </button>
              <button
                type="button"
                class="btn btn-danger d-inline-flex align-items-center"
                [disabled]="loading"
                (click)="confirm()">
                @if (loading) {
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                }
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed? This action cannot be undone.';
  @Input() confirmText = 'Delete';
  @Input() cancelText = 'Cancel';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isOpen = false;

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    if (this.loading) return;
    this.isOpen = false;
    this.cancelled.emit();
  }

  confirm(): void {
    if (this.loading) return;
    this.confirmed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }
}
