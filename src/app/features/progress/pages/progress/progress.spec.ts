import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { StudyCard } from '../../../../core/models/study-card.model';
import { StudyProgress } from '../../../../core/models/study-progress.model';
import { Topic } from '../../../../core/models/topic.model';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';
import { Progress } from './progress';

describe('Progress', () => {
  const loadingState = signal(false);
  const errorState = signal<string | null>(null);
  const topicsState = signal<readonly Topic[]>([]);
  const cardsState = signal<readonly StudyCard[]>([]);

  const loadContent = vi.fn(() => Promise.resolve());

  const progressState = signal<StudyProgress>({
    version: 1,
    completedCardIds: [],
    bookmarkedCardIds: [],
    difficultCardIds: [],
    lastStudiedTopicId: null,
    lastStudiedCardId: null,
    updatedAt: '2026-08-03T00:00:00.000Z',
  });

  const clearProgress = vi.fn();

  const contentMock: Pick<
    ContentService,
    'loading' | 'errorMessage' | 'enabledTopics' | 'cards' | 'loadContent' | 'getTopicById'
  > = {
    loading: loadingState.asReadonly(),
    errorMessage: errorState.asReadonly(),
    enabledTopics: topicsState.asReadonly(),
    cards: cardsState.asReadonly(),
    loadContent,
    getTopicById: (topicId: string) => topicsState().find((topic) => topic.id === topicId) ?? null,
  };

  const progressMock: Pick<
    StudyProgressService,
    'progress' | 'completedCount' | 'bookmarkedCount' | 'difficultCount' | 'clearProgress'
  > = {
    progress: progressState.asReadonly(),
    completedCount: computed(() => progressState().completedCardIds.length),
    bookmarkedCount: computed(() => progressState().bookmarkedCardIds.length),
    difficultCount: computed(() => progressState().difficultCardIds.length),
    clearProgress,
  };

  const openDialog = vi.fn(() => ({
    afterClosed: () => of(false),
  }));

  const dialogMock: Pick<MatDialog, 'open'> = {
    open: openDialog,
  };

  beforeEach(async () => {
    loadingState.set(false);
    errorState.set(null);
    topicsState.set([
      {
        id: 'introduction-to-ai',
        title: 'Introduction to Artificial Intelligence',
        shortTitle: 'Introduction to AI',
        description: 'Intro topic',
        icon: 'psychology',
        order: 1,
        enabled: true,
        estimatedMinutes: 10,
        cardCount: 2,
        tags: ['AI fundamentals'],
      },
      {
        id: 'ml-foundations',
        title: 'Machine Learning Foundations',
        shortTitle: 'ML Foundations',
        description: 'ML topic',
        icon: 'memory',
        order: 2,
        enabled: true,
        estimatedMinutes: 20,
        cardCount: 2,
        tags: ['ML'],
      },
    ]);

    cardsState.set([
      {
        id: 'AI-1',
        topicId: 'introduction-to-ai',
        title: 'Card 1',
        summary: 'Summary',
        keyPoints: ['A'],
        cardType: 'definition',
        difficulty: 'easy',
        importance: 'high',
        order: 1,
        tags: ['tag'],
        sourcePages: [10],
      },
      {
        id: 'AI-2',
        topicId: 'introduction-to-ai',
        title: 'Card 2',
        summary: 'Summary',
        keyPoints: ['B'],
        cardType: 'examples',
        difficulty: 'medium',
        importance: 'medium',
        order: 2,
        tags: ['tag'],
        sourcePages: [11],
      },
      {
        id: 'ML-1',
        topicId: 'ml-foundations',
        title: 'Card 3',
        summary: 'Summary',
        keyPoints: ['C'],
        cardType: 'definition',
        difficulty: 'easy',
        importance: 'high',
        order: 1,
        tags: ['tag'],
        sourcePages: [12],
      },
      {
        id: 'ML-2',
        topicId: 'ml-foundations',
        title: 'Card 4',
        summary: 'Summary',
        keyPoints: ['D'],
        cardType: 'examples',
        difficulty: 'medium',
        importance: 'medium',
        order: 2,
        tags: ['tag'],
        sourcePages: [13],
      },
    ]);

    progressState.set({
      version: 1,
      completedCardIds: ['AI-1', 'ML-1'],
      bookmarkedCardIds: ['AI-2'],
      difficultCardIds: ['ML-2'],
      lastStudiedTopicId: 'introduction-to-ai',
      lastStudiedCardId: 'AI-2',
      updatedAt: '2026-08-03T00:00:00.000Z',
    });

    clearProgress.mockClear();
    openDialog.mockClear();
    loadContent.mockClear();

    await TestBed.configureTestingModule({
      imports: [Progress],
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: dialogMock },
        { provide: ContentService, useValue: contentMock },
        { provide: StudyProgressService, useValue: progressMock },
      ],
    }).compileComponents();
  });

  it('renders visible totals, overall percentage, topic summary, and last studied topic', () => {
    const fixture = TestBed.createComponent(Progress);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Progress');
    expect(compiled.textContent).toContain('2 cards completed');
    expect(compiled.textContent).toContain('1 cards bookmarked');
    expect(compiled.textContent).toContain('1 cards marked difficult');
    expect(compiled.textContent).toContain('50% overall completion');
    expect(compiled.textContent).toContain('Introduction to Artificial Intelligence');
    expect(compiled.textContent).toContain('1 of 2 cards complete (50%)');
    expect(compiled.textContent).toContain('Machine Learning Foundations');
    expect(compiled.textContent).toContain('Most recent topic: Introduction to Artificial Intelligence');
  });

  it('does not clear progress when reset dialog is canceled', () => {
    openDialog.mockReturnValue({
      afterClosed: () => of(false),
    });

    const fixture = TestBed.createComponent(Progress);
    fixture.detectChanges();

    const resetButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Reset progress'),
    ) as HTMLButtonElement | undefined;

    expect(resetButton).toBeTruthy();
    resetButton?.click();

    expect(openDialog).toHaveBeenCalledTimes(1);
    expect(clearProgress).not.toHaveBeenCalled();
  });

  it('clears progress only after reset dialog confirmation', () => {
    openDialog.mockReturnValue({
      afterClosed: () => of(true),
    });

    const fixture = TestBed.createComponent(Progress);
    fixture.detectChanges();

    const resetButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Reset progress'),
    ) as HTMLButtonElement | undefined;

    expect(resetButton).toBeTruthy();
    resetButton?.click();

    expect(openDialog).toHaveBeenCalledTimes(1);
    expect(clearProgress).toHaveBeenCalledTimes(1);
  });
});
