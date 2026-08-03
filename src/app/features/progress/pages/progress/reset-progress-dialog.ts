import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-reset-progress-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Reset progress?</h2>
    <mat-dialog-content>
      <p>
        This will remove your locally stored study status from this browser and cannot be undone.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" mat-button cdkFocusInitial (click)="close(false)">Cancel</button>
      <button type="button" mat-flat-button (click)="close(true)">Reset progress</button>
    </mat-dialog-actions>
  `,
})
export class ResetProgressDialog {
  constructor(private readonly dialogRef: MatDialogRef<ResetProgressDialog, boolean>) {}

  close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
