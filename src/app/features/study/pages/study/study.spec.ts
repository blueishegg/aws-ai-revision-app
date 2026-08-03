import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { StudyCard } from '../../../../core/models/study-card.model';
import { StudyProgress } from '../../../../core/models/study-progress.model';
import { Topic } from '../../../../core/models/topic.model';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';
import { Study } from './study';

describe('Study', () => {
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

  const toggleCompleted = vi.fn();
  const toggleBookmarked = vi.fn();
  const toggleDifficult = vi.fn();
  const setLastStudied = vi.fn();

  const topicsFixture: readonly Topic[] = [
    {
      id: 'introduction-to-ai',
      title: 'Introduction to Artificial Intelligence',
      shortTitle: 'Introduction to AI',
      description: 'Intro topic description.',
      icon: 'psychology',
      order: 1,
      enabled: true,
      estimatedMinutes: 10,
      cardCount: 2,
      tags: ['AI fundamentals'],
    },
  ];

  const cardsFixture: readonly StudyCard[] = [
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
  ];

  const paramMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));
  const queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));

  const activatedRouteMock: Pick<ActivatedRoute, 'paramMap' | 'queryParamMap' | 'snapshot'> = {
    paramMap: paramMapSubject.asObservable(),
    queryParamMap: queryParamMapSubject.asObservable(),
    snapshot: {
      paramMap: paramMapSubject.value,
      queryParamMap: queryParamMapSubject.value,
    } as ActivatedRoute['snapshot'],
  };

  const routerNavigate = vi.fn(() => Promise.resolve(true));

  const contentMock: Pick<
    ContentService,
    'loading' | 'errorMessage' | 'loadContent' | 'getTopicById' | 'getCardsByTopicId' | 'getCardById'
  > = {
    loading: loadingState.asReadonly(),
    errorMessage: errorState.asReadonly(),
    loadContent,
    getTopicById: (topicId: string) => topicsState().find((topic) => topic.id === topicId) ?? null,
    getCardsByTopicId: (topicId: string) =>
      cardsState()
        .filter((card) => card.topicId === topicId)
        .slice()
        .sort((left, right) => left.order - right.order),
    getCardById: (cardId: string) => cardsState().find((card) => card.id === cardId) ?? null,
  };

  const progressMock: Pick<
    StudyProgressService,
    | 'progress'
    | 'isCompleted'
    | 'isBookmarked'
    | 'isDifficult'
    | 'toggleCompleted'
    | 'toggleBookmarked'
    | 'toggleDifficult'
    | 'setLastStudied'
  > = {
    progress: progressState.asReadonly(),
    isCompleted: (cardId: string) => progressState().completedCardIds.includes(cardId),
    isBookmarked: (cardId: string) => progressState().bookmarkedCardIds.includes(cardId),
    isDifficult: (cardId: string) => progressState().difficultCardIds.includes(cardId),
    toggleCompleted,
    toggleBookmarked,
    toggleDifficult,
    setLastStudied,
  };

  function setRoute(topicId: string | null, cardId: string | null): void {
    const nextParamMap = convertToParamMap(topicId ? { topicId } : {});
    const nextQueryParamMap = convertToParamMap(cardId ? { card: cardId } : {});

    paramMapSubject.next(nextParamMap);
    queryParamMapSubject.next(nextQueryParamMap);

    activatedRouteMock.snapshot = {
      paramMap: nextParamMap,
      queryParamMap: nextQueryParamMap,
    } as ActivatedRoute['snapshot'];
  }

  function createStudy(): Study {
    return TestBed.runInInjectionContext(() => new Study());
  }

  beforeEach(() => {
    loadingState.set(false);
    errorState.set(null);
    topicsState.set(topicsFixture);
    cardsState.set(cardsFixture);
    progressState.set({
      version: 1,
      completedCardIds: [],
      bookmarkedCardIds: [],
      difficultCardIds: [],
      lastStudiedTopicId: null,
      lastStudiedCardId: null,
      updatedAt: '2026-08-03T00:00:00.000Z',
    });
    setRoute(null, null);

    loadContent.mockClear();
    toggleCompleted.mockClear();
    toggleBookmarked.mockClear();
    toggleDifficult.mockClear();
    setLastStudied.mockClear();
    routerNavigate.mockClear();

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: { navigate: routerNavigate } },
        { provide: ContentService, useValue: contentMock },
        { provide: StudyProgressService, useValue: progressMock },
      ],
    });
  });

  it('loads content on construction', () => {
    createStudy();

    expect(loadContent).toHaveBeenCalledTimes(1);
  });

  it('normalizes initial card selection to first incomplete card', () => {
    progressState.set({
      ...progressState(),
      completedCardIds: ['AI-1'],
    });
    setRoute('introduction-to-ai', null);

    const study = createStudy() as Study & { visibleCardId: () => string | null };

    expect(study.visibleCardId()).toBe('AI-2');
    expect(routerNavigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { card: 'AI-2' },
        replaceUrl: true,
      }),
    );
  });

  it('uses a valid card query param without redirecting', () => {
    setRoute('introduction-to-ai', 'AI-1');

    const study = createStudy() as Study & { visibleCardId: () => string | null };

    expect(study.visibleCardId()).toBe('AI-1');
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('marks unknown topics without redirect', () => {
    setRoute('missing-topic', null);

    const study = createStudy() as Study & { hasUnknownTopic: () => boolean };

    expect(study.hasUnknownTopic()).toBe(true);
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('moves to next card and finishes to topics on last card', () => {
    setRoute('introduction-to-ai', 'AI-1');

    const study = createStudy() as Study & { goToNextCard: () => void };
    routerNavigate.mockClear();

    study.goToNextCard();

    expect(routerNavigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { card: 'AI-2' } }),
    );

    routerNavigate.mockClear();
    setRoute('introduction-to-ai', 'AI-2');
    study.goToNextCard();

    expect(routerNavigate).toHaveBeenCalledWith(['/topics']);
  });

  it('forwards toggle events to StudyProgressService when state changes', () => {
    setRoute('introduction-to-ai', 'AI-1');

    const study = createStudy() as Study & {
      onCompletedChange: (nextValue: boolean) => void;
      onBookmarkedChange: (nextValue: boolean) => void;
      onDifficultChange: (nextValue: boolean) => void;
    };

    study.onCompletedChange(true);
    study.onCompletedChange(false);
    study.onBookmarkedChange(true);
    study.onDifficultChange(true);

    expect(toggleCompleted).toHaveBeenCalledTimes(1);
    expect(toggleCompleted).toHaveBeenCalledWith('AI-1');
    expect(toggleBookmarked).toHaveBeenCalledWith('AI-1');
    expect(toggleDifficult).toHaveBeenCalledWith('AI-1');
  });

  it('persists last studied card when visible card changes', () => {
    setRoute('introduction-to-ai', 'AI-1');

    createStudy();
    expect(setLastStudied).toHaveBeenCalledTimes(1);
    expect(setLastStudied).toHaveBeenCalledWith('introduction-to-ai', 'AI-1');

    setRoute('introduction-to-ai', 'AI-1');
    expect(setLastStudied).toHaveBeenCalledTimes(1);

    setRoute('introduction-to-ai', 'AI-2');
    expect(setLastStudied).toHaveBeenCalledTimes(2);
    expect(setLastStudied).toHaveBeenLastCalledWith('introduction-to-ai', 'AI-2');
  });
});
