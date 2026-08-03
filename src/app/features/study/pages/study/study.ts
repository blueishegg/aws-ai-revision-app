import { computed, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';
import { StudyCardComponent } from '../../../../shared/components/study-card/study-card';

@Component({
  selector: 'app-study',
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    RouterLink,
    StudyCardComponent,
  ],
  templateUrl: './study.html',
  styleUrl: './study.scss',
})
export class Study {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly content = inject(ContentService);
  private readonly progress = inject(StudyProgressService);

  private lastPersistedKey: string | null = null;

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly requestedTopicId = computed(() => this.paramMap().get('topicId'));

  private readonly requestedCardId = computed(() => this.queryParamMap().get('card'));

  protected readonly selectedTopic = computed(() => {
    const topicId = this.requestedTopicId();
    return topicId ? this.content.getTopicById(topicId) ?? null : null;
  });

  protected readonly selectedTopicCards = computed(() => {
    const topic = this.selectedTopic();
    return topic ? this.content.getCardsByTopicId(topic.id) : [];
  });

  private readonly startCardId = computed(() => {
    const topic = this.selectedTopic();
    if (!topic) {
      return null;
    }

    const cards = this.selectedTopicCards();
    if (cards.length === 0) {
      return null;
    }

    const currentProgress = this.progress.progress();
    if (
      currentProgress.lastStudiedTopicId === topic.id &&
      currentProgress.lastStudiedCardId !== null &&
      cards.some((card) => card.id === currentProgress.lastStudiedCardId)
    ) {
      return currentProgress.lastStudiedCardId;
    }

    const firstIncomplete = cards.find((card) => !this.progress.isCompleted(card.id));
    return firstIncomplete?.id ?? cards[0].id;
  });

  protected readonly visibleCardId = computed(() => {
    const cards = this.selectedTopicCards();
    if (cards.length === 0) {
      return null;
    }

    const requested = this.requestedCardId();
    if (requested && cards.some((card) => card.id === requested)) {
      return requested;
    }

    return this.startCardId();
  });

  protected readonly visibleCard = computed(() => {
    const cardId = this.visibleCardId();
    return cardId ? this.content.getCardById(cardId) ?? null : null;
  });

  protected readonly cardIndex = computed(() => {
    const cards = this.selectedTopicCards();
    const cardId = this.visibleCardId();
    return cardId ? cards.findIndex((card) => card.id === cardId) : -1;
  });

  protected readonly cardPositionLabel = computed(() => {
    const cards = this.selectedTopicCards();
    const index = this.cardIndex();

    if (cards.length === 0 || index < 0) {
      return 'Card 0 of 0';
    }

    return `Card ${index + 1} of ${cards.length}`;
  });

  protected readonly hasPreviousCard = computed(() => this.cardIndex() > 0);

  protected readonly isLastCard = computed(() => {
    const cards = this.selectedTopicCards();
    return cards.length > 0 && this.cardIndex() === cards.length - 1;
  });

  protected readonly topicCompletedCount = computed(() => {
    const completedIds = new Set(this.progress.progress().completedCardIds);
    return this.selectedTopicCards().reduce(
      (count, card) => (completedIds.has(card.id) ? count + 1 : count),
      0,
    );
  });

  protected readonly topicCompletionPercentage = computed(() => {
    const total = this.selectedTopicCards().length;
    if (total <= 0) {
      return 0;
    }

    return Math.round((this.topicCompletedCount() / total) * 100);
  });

  protected readonly nextButtonLabel = computed(() =>
    this.isLastCard() ? 'Finish topic' : 'Next',
  );

  protected readonly hasUnknownTopic = computed(() => {
    const topicId = this.requestedTopicId();
    return (
      topicId !== null &&
      !this.content.loading() &&
      this.content.errorMessage() === null &&
      this.selectedTopic() === null
    );
  });

  constructor() {
    void this.content.loadContent();

    effect(() => {
      const topicId = this.requestedTopicId();
      const visibleCardId = this.visibleCardId();
      const requestedCardId = this.requestedCardId();

      if (
        !topicId ||
        !visibleCardId ||
        this.content.loading() ||
        this.content.errorMessage() !== null ||
        this.hasUnknownTopic()
      ) {
        return;
      }

      if (requestedCardId !== visibleCardId) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { card: visibleCardId },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });

    effect(() => {
      const topic = this.selectedTopic();
      const card = this.visibleCard();
      if (!topic || !card) {
        return;
      }

      const key = `${topic.id}:${card.id}`;
      if (key === this.lastPersistedKey) {
        return;
      }

      this.lastPersistedKey = key;
      this.progress.setLastStudied(topic.id, card.id);
    });
  }

  protected goToPreviousCard(): void {
    const cards = this.selectedTopicCards();
    const currentIndex = this.cardIndex();

    if (currentIndex <= 0) {
      return;
    }

    void this.navigateToCard(cards[currentIndex - 1].id);
  }

  protected goToNextCard(): void {
    if (this.isLastCard()) {
      void this.router.navigate(['/topics']);
      return;
    }

    const cards = this.selectedTopicCards();
    const currentIndex = this.cardIndex();
    if (currentIndex < 0 || currentIndex >= cards.length - 1) {
      return;
    }

    void this.navigateToCard(cards[currentIndex + 1].id);
  }

  protected onCompletedChange(nextValue: boolean): void {
    this.syncToggleState('completed', nextValue);
  }

  protected onBookmarkedChange(nextValue: boolean): void {
    this.syncToggleState('bookmarked', nextValue);
  }

  protected onDifficultChange(nextValue: boolean): void {
    this.syncToggleState('difficult', nextValue);
  }

  protected isVisibleCardCompleted(): boolean {
    const card = this.visibleCard();
    return card ? this.progress.isCompleted(card.id) : false;
  }

  protected isVisibleCardBookmarked(): boolean {
    const card = this.visibleCard();
    return card ? this.progress.isBookmarked(card.id) : false;
  }

  protected isVisibleCardDifficult(): boolean {
    const card = this.visibleCard();
    return card ? this.progress.isDifficult(card.id) : false;
  }

  private syncToggleState(
    type: 'completed' | 'bookmarked' | 'difficult',
    nextValue: boolean,
  ): void {
    const card = this.visibleCard();
    if (!card) {
      return;
    }

    if (type === 'completed') {
      if (this.progress.isCompleted(card.id) !== nextValue) {
        this.progress.toggleCompleted(card.id);
      }
      return;
    }

    if (type === 'bookmarked') {
      if (this.progress.isBookmarked(card.id) !== nextValue) {
        this.progress.toggleBookmarked(card.id);
      }
      return;
    }

    if (this.progress.isDifficult(card.id) !== nextValue) {
      this.progress.toggleDifficult(card.id);
    }
  }

  private navigateToCard(cardId: string): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { card: cardId },
      queryParamsHandling: 'merge',
    });
  }
}
