import { computed, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { StudyCard as StudyCardModel } from '../../../core/models/study-card.model';

@Component({
  selector: 'app-study-card',
  imports: [MatButtonModule, MatChipsModule],
  templateUrl: './study-card.html',
  styleUrl: './study-card.scss',
})
export class StudyCardComponent {
  readonly card = input.required<StudyCardModel>();

  readonly completed = input(false);
  readonly bookmarked = input(false);
  readonly difficult = input(false);

  readonly completedChange = output<boolean>();
  readonly bookmarkedChange = output<boolean>();
  readonly difficultChange = output<boolean>();

  readonly visibleTags = computed(() => this.card().tags.slice(0, 3));

  readonly sourcePagesLabel = computed(() => formatSourcePages(this.card().sourcePages));

  readonly cardTypeLabel = computed(() => formatCardType(this.card().cardType));

  readonly difficultyLabel = computed(() => formatDifficulty(this.card().difficulty));

  readonly importanceLabel = computed(() => formatImportance(this.card().importance));

  toggleCompleted(): void {
    this.completedChange.emit(!this.completed());
  }

  toggleBookmarked(): void {
    this.bookmarkedChange.emit(!this.bookmarked());
  }

  toggleDifficult(): void {
    this.difficultChange.emit(!this.difficult());
  }
}

function formatCardType(value: StudyCardModel['cardType']): string {
  return value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function formatDifficulty(value: StudyCardModel['difficulty']): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} difficulty`;
}

function formatImportance(value: StudyCardModel['importance']): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} importance`;
}

function formatSourcePages(sourcePages: readonly number[]): string {
  if (sourcePages.length === 0) {
    return 'Source pages: n/a';
  }

  const sorted = [...sourcePages].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (first === last) {
    return `Source pages: ${first}`;
  }

  return `Source pages: ${first}–${last}`;
}
