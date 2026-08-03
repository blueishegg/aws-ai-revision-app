import { computed, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { StudyCard } from '../../../../core/models/study-card.model';
import { Topic } from '../../../../core/models/topic.model';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';

type TopicCardViewModel = {
  readonly topic: Topic;
  readonly completedCount: number;
  readonly cardCount: number;
  readonly completionPercentage: number;
  readonly ctaLabel: 'Start topic' | 'Continue topic' | 'Review topic';
  readonly visibleTags: readonly string[];
};

@Component({
  selector: 'app-topics',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, RouterLink],
  templateUrl: './topics.html',
  styleUrl: './topics.scss',
})
export class Topics {
  protected readonly content = inject(ContentService);
  private readonly progress = inject(StudyProgressService);

  protected readonly topicCards = computed<readonly TopicCardViewModel[]>(() => {
    const completedIds = new Set(this.progress.progress().completedCardIds);
    const allCards = this.content.cards();

    return this.content.enabledTopics().map((topic) =>
      this.buildTopicViewModel(topic, allCards, completedIds),
    );
  });

  constructor() {
    void this.content.loadContent();
  }

  private buildTopicViewModel(
    topic: Topic,
    allCards: readonly StudyCard[],
    completedIds: ReadonlySet<string>,
  ): TopicCardViewModel {
    const topicCards = allCards.filter((card) => card.topicId === topic.id);
    const cardCount = topicCards.length;
    const completedCount = topicCards.reduce(
      (count, card) => (completedIds.has(card.id) ? count + 1 : count),
      0,
    );

    return {
      topic,
      completedCount,
      cardCount,
      completionPercentage: computePercentage(completedCount, cardCount),
      ctaLabel: computeCtaLabel(completedCount, cardCount),
      visibleTags: topic.tags.slice(0, 3),
    };
  }
}

function computePercentage(completedCount: number, cardCount: number): number {
  if (cardCount <= 0) {
    return 0;
  }

  return Math.round((completedCount / cardCount) * 100);
}

function computeCtaLabel(
  completedCount: number,
  cardCount: number,
): 'Start topic' | 'Continue topic' | 'Review topic' {
  if (cardCount > 0 && completedCount >= cardCount) {
    return 'Review topic';
  }

  if (completedCount > 0) {
    return 'Continue topic';
  }

  return 'Start topic';
}
