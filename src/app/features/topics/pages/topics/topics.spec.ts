import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { StudyCard } from '../../../../core/models/study-card.model';
import { StudyProgress } from '../../../../core/models/study-progress.model';
import { Topic } from '../../../../core/models/topic.model';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';
import { Topics } from './topics';

describe('Topics', () => {
  const loadingState = signal(false);
  const errorState = signal<string | null>(null);
  const topicsState = signal<Topic[]>([]);
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

  const contentMock: Pick<
    ContentService,
    'loading' | 'errorMessage' | 'enabledTopics' | 'cards' | 'loadContent'
  > = {
    loading: loadingState.asReadonly(),
    errorMessage: errorState.asReadonly(),
    enabledTopics: topicsState.asReadonly(),
    cards: cardsState.asReadonly(),
    loadContent,
  };

  const progressMock: Pick<StudyProgressService, 'progress'> = {
    progress: progressState.asReadonly(),
  };

  beforeEach(async () => {
    loadingState.set(false);
    errorState.set(null);
    topicsState.set([]);
    cardsState.set([]);
    progressState.set({
      version: 1,
      completedCardIds: [],
      bookmarkedCardIds: [],
      difficultCardIds: [],
      lastStudiedTopicId: null,
      lastStudiedCardId: null,
      updatedAt: '2026-08-03T00:00:00.000Z',
    });
    loadContent.mockClear();

    await TestBed.configureTestingModule({
      imports: [Topics],
      providers: [
        provideRouter([]),
        { provide: ContentService, useValue: contentMock },
        { provide: StudyProgressService, useValue: progressMock },
      ],
    }).compileComponents();
  });

  it('shows a loading state while content loads', () => {
    loadingState.set(true);

    const fixture = TestBed.createComponent(Topics);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Loading topics...');
    expect(loadContent).toHaveBeenCalledTimes(1);
  });

  it('renders the Introduction to AI topic card', () => {
    topicsState.set([
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
        tags: ['AI fundamentals', 'AIF-C01'],
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
    ]);

    progressState.set({
      version: 1,
      completedCardIds: ['AI-1'],
      bookmarkedCardIds: [],
      difficultCardIds: [],
      lastStudiedTopicId: null,
      lastStudiedCardId: null,
      updatedAt: '2026-08-03T00:00:00.000Z',
    });

    const fixture = TestBed.createComponent(Topics);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Introduction to Artificial Intelligence');
    expect(compiled.textContent).toContain('10 min');
    expect(compiled.textContent).toContain('2 cards');
    expect(compiled.textContent).toContain('1 completed');
    expect(compiled.textContent).toContain('50% complete');
    expect(compiled.textContent).toContain('Continue topic');
  });

  it('builds the correct study link for a topic', () => {
    topicsState.set([
      {
        id: 'introduction-to-ai',
        title: 'Introduction to Artificial Intelligence',
        shortTitle: 'Introduction to AI',
        description: 'Intro topic description.',
        icon: 'psychology',
        order: 1,
        enabled: true,
        estimatedMinutes: 10,
        cardCount: 1,
        tags: ['AI fundamentals'],
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
    ]);

    const fixture = TestBed.createComponent(Topics);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a[mat-flat-button]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/study/introduction-to-ai');
  });

  it('shows an error state when content fails to load', () => {
    errorState.set('Unable to load revision content at this time.');

    const fixture = TestBed.createComponent(Topics);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Topics unavailable');
    expect(compiled.textContent).toContain('Unable to load revision content at this time.');
  });
});
