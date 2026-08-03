import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { StudyCard, StudyComparisonItem } from '../models/study-card.model';
import { Topic } from '../models/topic.model';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private readonly http = inject(HttpClient);

  private readonly topicsState = signal<readonly Topic[]>([]);
  readonly topics = this.topicsState.asReadonly();

  private readonly cardsState = signal<readonly StudyCard[]>([]);
  readonly cards = this.cardsState.asReadonly();

  private readonly loadingState = signal(false);
  readonly loading = this.loadingState.asReadonly();

  private readonly errorMessageState = signal<string | null>(null);
  readonly errorMessage = this.errorMessageState.asReadonly();

  readonly enabledTopics = computed(() =>
    [...this.topics()]
      .filter((topic) => topic.enabled)
      .sort((a, b) => a.order - b.order),
  );

  private hasLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    void this.loadContent();
  }

  getTopicById(topicId: string): Topic | undefined {
    return this.topics().find((topic) => topic.id === topicId);
  }

  getCardsByTopicId(topicId: string): readonly StudyCard[] {
    return this.cards()
      .filter((card) => card.topicId === topicId)
      .sort((a, b) => a.order - b.order);
  }

  getCardById(cardId: string): StudyCard | undefined {
    return this.cards().find((card) => card.id === cardId);
  }

  loadContent(): Promise<void> {
    if (this.hasLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadingState.set(true);
    this.errorMessageState.set(null);

    this.loadPromise = firstValueFrom(
      forkJoin({
        topics: this.http.get<readonly Topic[]>('/data/topics.json'),
        cards: this.http.get<readonly StudyCard[]>('/data/study-cards.json'),
      }),
    )
      .then(({ topics, cards }) => {
        this.topicsState.set(freezeTopics(topics));
        this.cardsState.set(freezeCards(cards));
        this.hasLoaded = true;
      })
      .catch((error: unknown) => {
        console.error('Failed to load revision content.', error);
        this.errorMessageState.set('Unable to load revision content at this time.');
      })
      .finally(() => {
        this.loadingState.set(false);
        this.loadPromise = null;
      });

    return this.loadPromise;
  }
}

function freezeTopics(topics: readonly Topic[]): readonly Topic[] {
  const immutableTopics = topics.map((topic) =>
    Object.freeze({
      ...topic,
      tags: Object.freeze([...topic.tags]),
    }),
  );

  return Object.freeze(immutableTopics);
}

function freezeCards(cards: readonly StudyCard[]): readonly StudyCard[] {
  const immutableCards = cards.map((card) =>
    Object.freeze({
      ...card,
      keyPoints: Object.freeze([...card.keyPoints]),
      tags: Object.freeze([...card.tags]),
      sourcePages: Object.freeze([...card.sourcePages]),
      comparison: card.comparison ? freezeComparison(card.comparison) : undefined,
    }),
  );

  return Object.freeze(immutableCards);
}

function freezeComparison(items: readonly StudyComparisonItem[]): readonly StudyComparisonItem[] {
  return Object.freeze(items.map((item) => Object.freeze({ ...item })));
}
