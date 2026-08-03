import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-placeholder',
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './page-placeholder.html',
  styleUrl: './page-placeholder.scss',
})
export class PagePlaceholder {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input.required<string>();
  readonly eyebrow = input<string>('AWS Certified AI Practitioner');
  readonly statusText = input<string>('Coming in a later milestone');
}
