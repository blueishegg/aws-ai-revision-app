import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';

import { Topic } from '../../../../core/models/topic.model';
import { StudyProgress } from '../../../../core/models/study-progress.model';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  const loadingState = signal(false);
  const errorState = signal<string | null>(null);
  const topicsState = signal<readonly Topic[]>([]);

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
    'loading' | 'errorMessage' | 'enabledTopics' | 'loadContent' | 'getTopicById'
  > = {
    loading: loadingState.asReadonly(),
    errorMessage: errorState.asReadonly(),
    enabledTopics: topicsState.asReadonly(),
    loadContent,
    getTopicById: (topicId: string) => topicsState().find((topic) => topic.id === topicId) ?? null,
  };

  const progressMock: Pick<
    StudyProgressService,
    'progress' | 'completedCount' | 'bookmarkedCount' | 'difficultCount'
  > = {
    progress: progressState.asReadonly(),
    completedCount: computed(() => progressState().completedCardIds.length),
    bookmarkedCount: computed(() => progressState().bookmarkedCardIds.length),
    difficultCount: computed(() => progressState().difficultCardIds.length),
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
    ]);

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
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: ContentService, useValue: contentMock },
        { provide: StudyProgressService, useValue: progressMock },
      ],
    }).compileComponents();
  });

  it('shows honest zero progress values when there is no saved progress', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('0 cards completed');
    expect(compiled.textContent).toContain('0 cards bookmarked');
    expect(compiled.textContent).toContain('0 cards marked difficult');
  });

  it('renders genuine non-zero progress summary values', () => {
    progressState.set({
      ...progressState(),
      completedCardIds: ['AI-1', 'AI-2'],
      bookmarkedCardIds: ['AI-2'],
      difficultCardIds: ['AI-1'],
    });

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2 cards completed');
    expect(compiled.textContent).toContain('1 cards bookmarked');
    expect(compiled.textContent).toContain('1 cards marked difficult');
  });

  it('shows a continue studying action only when last studied topic exists', () => {
    progressState.set({
      ...progressState(),
      lastStudiedTopicId: 'introduction-to-ai',
    });

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Continue studying');

    const continueLink = Array.from(compiled.querySelectorAll('a')).find((link) =>
      link.textContent?.includes('Continue studying'),
    ) as HTMLAnchorElement | undefined;

    expect(continueLink).toBeTruthy();
    expect(continueLink?.getAttribute('href')).toContain('/study/introduction-to-ai');
  });

  it('hides continue studying action when there is no last studied topic', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Continue studying');
  });

  it('routes Open study to last studied topic when available', () => {
    progressState.set({
      ...progressState(),
      lastStudiedTopicId: 'introduction-to-ai',
    });

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const openStudyLink = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a[mat-button]'),
    ).find((link) => link.textContent?.includes('Open study')) as HTMLAnchorElement | undefined;

    expect(openStudyLink).toBeTruthy();
    expect(openStudyLink?.getAttribute('href')).toContain('/study/introduction-to-ai');
  });

  it('routes Open study to topics when no last studied topic exists', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const openStudyLink = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a[mat-button]'),
    ).find((link) => link.textContent?.includes('Open study')) as HTMLAnchorElement | undefined;

    expect(openStudyLink).toBeTruthy();
    expect(openStudyLink?.getAttribute('href')).toContain('/topics');
  });

  it('labels quiz as Milestone 3 placeholder and still keeps quiz action', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Try a quiz (Milestone 3)');
    expect(compiled.textContent).toContain('Open quiz (Milestone 3)');
  });

  it('loads content for topic-aware linking', () => {
    TestBed.createComponent(Dashboard).detectChanges();

    expect(loadContent).toHaveBeenCalledTimes(1);
  });
});
