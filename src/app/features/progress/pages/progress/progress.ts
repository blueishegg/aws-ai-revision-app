import { computed, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { StudyCard } from '../../../../core/models/study-card.model';
import { Topic } from '../../../../core/models/topic.model';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';
import { ResetProgressDialog } from './reset-progress-dialog';

type TopicSummary = {
  readonly topic: Topic;
  readonly cardCount: number;
  readonly completedCount: number;
  readonly completionPercentage: number;
};

@Component({
  selector: 'app-progress',
  imports: [MatButtonModule, MatCardModule, MatDialogModule, RouterLink],
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
})
export class Progress {
  private readonly dialog = inject(MatDialog);
  protected readonly content = inject(ContentService);
  protected readonly studyProgress = inject(StudyProgressService);

  protected readonly overallCompletionPercentage = computed(() => {
    const totalCards = this.content.cards().length;
    if (totalCards <= 0) {
      return 0;
    }

    return Math.round((this.studyProgress.completedCount() / totalCards) * 100);
  });

  protected readonly topicSummaries = computed<readonly TopicSummary[]>(() => {
    const cards = this.content.cards();
    const completedIds = new Set(this.studyProgress.progress().completedCardIds);

    return this.content.enabledTopics().map((topic) =>
      this.buildTopicSummary(topic, cards, completedIds),
    );
  });

  protected readonly lastStudiedTopic = computed(() => {
    const topicId = this.studyProgress.progress().lastStudiedTopicId;
    if (!topicId) {
      return null;
    }

    return this.content.getTopicById(topicId) ?? null;
  });

  constructor() {
    void this.content.loadContent();
  }

  protected openResetDialog(): void {
    const dialogRef = this.dialog.open(ResetProgressDialog, {
      width: '420px',
      maxWidth: '94vw',
      autoFocus: false,
      restoreFocus: true,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed === true) {
        this.studyProgress.clearProgress();
      }
    });
  }

  private buildTopicSummary(
    topic: Topic,
    allCards: readonly StudyCard[],
    completedIds: ReadonlySet<string>,
  ): TopicSummary {
    const topicCards = allCards.filter((card) => card.topicId === topic.id);
    const completedCount = topicCards.reduce(
      (count, card) => (completedIds.has(card.id) ? count + 1 : count),
      0,
    );

    return {
      topic,
      cardCount: topicCards.length,
      completedCount,
      completionPercentage: computePercentage(completedCount, topicCards.length),
    };
  }
}

function computePercentage(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}
