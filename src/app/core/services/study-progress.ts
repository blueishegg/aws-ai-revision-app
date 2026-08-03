import { computed, inject, Injectable, signal } from '@angular/core';
import { StudyProgress } from '../models/study-progress.model';
import { BrowserStorageService } from './browser-storage';

const STUDY_PROGRESS_STORAGE_KEY = 'aws-ai-revision.study-progress.v1';

type StudyProgressRecord = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class StudyProgressService {
  private readonly storage = inject(BrowserStorageService);

  private readonly state = signal<StudyProgress>(this.loadInitialState());
  readonly progress = this.state.asReadonly();

  readonly completedCount = computed(() => this.progress().completedCardIds.length);
  readonly bookmarkedCount = computed(() => this.progress().bookmarkedCardIds.length);
  readonly difficultCount = computed(() => this.progress().difficultCardIds.length);

  isCompleted(cardId: string): boolean {
    return this.progress().completedCardIds.includes(cardId);
  }

  isBookmarked(cardId: string): boolean {
    return this.progress().bookmarkedCardIds.includes(cardId);
  }

  isDifficult(cardId: string): boolean {
    return this.progress().difficultCardIds.includes(cardId);
  }

  toggleCompleted(cardId: string): void {
    this.updateProgress((current) => ({
      ...current,
      completedCardIds: toggleId(current.completedCardIds, cardId),
    }));
  }

  toggleBookmarked(cardId: string): void {
    this.updateProgress((current) => ({
      ...current,
      bookmarkedCardIds: toggleId(current.bookmarkedCardIds, cardId),
    }));
  }

  toggleDifficult(cardId: string): void {
    this.updateProgress((current) => ({
      ...current,
      difficultCardIds: toggleId(current.difficultCardIds, cardId),
    }));
  }

  setLastStudied(topicId: string | null, cardId: string | null): void {
    this.updateProgress((current) => ({
      ...current,
      lastStudiedTopicId: topicId,
      lastStudiedCardId: cardId,
    }));
  }

  clearProgress(): void {
    const nextState = freezeProgress(createInitialState());
    this.state.set(nextState);
    this.storage.setJson(STUDY_PROGRESS_STORAGE_KEY, nextState);
  }

  private updateProgress(
    updater: (current: StudyProgress) => Omit<StudyProgress, 'updatedAt' | 'version'> &
      Pick<StudyProgress, 'updatedAt' | 'version'>,
  ): void {
    const current = this.progress();
    const nextDraft = updater(current);
    const nextState = freezeProgress({
      ...nextDraft,
      version: 1,
      updatedAt: new Date().toISOString(),
    });

    this.state.set(nextState);
    this.storage.setJson(STUDY_PROGRESS_STORAGE_KEY, nextState);
  }

  private loadInitialState(): StudyProgress {
    const fallback = createInitialState();
    const stored = this.storage.getJson<unknown>(STUDY_PROGRESS_STORAGE_KEY, null);

    if (!isStudyProgressRecord(stored)) {
      return freezeProgress(fallback);
    }

    return freezeProgress({
      version: 1,
      completedCardIds: uniqueStringArray(stored['completedCardIds']),
      bookmarkedCardIds: uniqueStringArray(stored['bookmarkedCardIds']),
      difficultCardIds: uniqueStringArray(stored['difficultCardIds']),
      lastStudiedTopicId: nullableString(stored['lastStudiedTopicId']),
      lastStudiedCardId: nullableString(stored['lastStudiedCardId']),
      updatedAt: validIsoString(stored['updatedAt']) ?? fallback.updatedAt,
    });
  }
}

function createInitialState(): StudyProgress {
  return {
    version: 1,
    completedCardIds: [],
    bookmarkedCardIds: [],
    difficultCardIds: [],
    lastStudiedTopicId: null,
    lastStudiedCardId: null,
    updatedAt: new Date().toISOString(),
  };
}

function toggleId(ids: readonly string[], targetId: string): readonly string[] {
  if (ids.includes(targetId)) {
    return ids.filter((id) => id !== targetId);
  }

  return [...ids, targetId];
}

function uniqueStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueIds = value.filter((entry): entry is string => typeof entry === 'string');
  return [...new Set(uniqueIds)];
}

function nullableString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  return null;
}

function validIsoString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function isStudyProgressRecord(value: unknown): value is StudyProgressRecord {
  return typeof value === 'object' && value !== null;
}

function freezeProgress(progress: StudyProgress): StudyProgress {
  return Object.freeze({
    ...progress,
    completedCardIds: Object.freeze([...progress.completedCardIds]),
    bookmarkedCardIds: Object.freeze([...progress.bookmarkedCardIds]),
    difficultCardIds: Object.freeze([...progress.difficultCardIds]),
  });
}
