import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { StudyProgress } from '../models/study-progress.model';
import { BrowserStorageService } from './browser-storage';
import { StudyProgressService } from './study-progress';

describe('StudyProgressService', () => {
  let service: StudyProgressService;

  let storedValue: unknown;
  const getJsonSpy = vi.fn((_: string, fallback: unknown) =>
    storedValue === undefined ? fallback : storedValue,
  );
  const setJsonSpy = vi.fn((_: string, __: unknown) => true);
  const removeSpy = vi.fn((_: string) => true);

  const storageMock: Pick<BrowserStorageService, 'getJson' | 'setJson' | 'remove'> = {
    getJson<T>(key: string, fallback: T): T {
      return getJsonSpy(key, fallback) as T;
    },
    setJson<T>(key: string, value: T): boolean {
      return setJsonSpy(key, value);
    },
    remove(key: string): boolean {
      return removeSpy(key);
    },
  };

  beforeEach(() => {
    storedValue = undefined;
    getJsonSpy.mockClear();
    setJsonSpy.mockClear();
    removeSpy.mockClear();

    TestBed.configureTestingModule({
      providers: [{ provide: BrowserStorageService, useValue: storageMock }],
    });
  });

  function createService(): StudyProgressService {
    service = TestBed.inject(StudyProgressService);
    return service;
  }

  it('starts with the initial empty state', () => {
    createService();
    const progress = service.progress();

    expect(progress.version).toBe(1);
    expect(progress.completedCardIds).toEqual([]);
    expect(progress.bookmarkedCardIds).toEqual([]);
    expect(progress.difficultCardIds).toEqual([]);
    expect(progress.lastStudiedTopicId).toBeNull();
    expect(progress.lastStudiedCardId).toBeNull();
    expect(Number.isNaN(Date.parse(progress.updatedAt))).toBe(false);
    expect(service.completedCount()).toBe(0);
    expect(service.bookmarkedCount()).toBe(0);
    expect(service.difficultCount()).toBe(0);
  });

  it('loads and sanitizes saved state', () => {
    storedValue = {
      version: 8,
      completedCardIds: ['A', 'A', 'B'],
      bookmarkedCardIds: ['B1'],
      difficultCardIds: ['D1', 42],
      lastStudiedTopicId: 'intro-topic',
      lastStudiedCardId: 'C7',
      updatedAt: '2026-01-02T10:00:00.000Z',
    };

    createService();

    const progress = service.progress();
    expect(progress.version).toBe(1);
    expect(progress.completedCardIds).toEqual(['A', 'B']);
    expect(progress.bookmarkedCardIds).toEqual(['B1']);
    expect(progress.difficultCardIds).toEqual(['D1']);
    expect(progress.lastStudiedTopicId).toBe('intro-topic');
    expect(progress.lastStudiedCardId).toBe('C7');
    expect(progress.updatedAt).toBe('2026-01-02T10:00:00.000Z');
  });

  it('toggles completed, bookmarked and difficult states', () => {
    createService();
    service.toggleCompleted('CARD-1');
    service.toggleBookmarked('CARD-1');
    service.toggleDifficult('CARD-2');

    expect(service.isCompleted('CARD-1')).toBe(true);
    expect(service.isBookmarked('CARD-1')).toBe(true);
    expect(service.isDifficult('CARD-2')).toBe(true);
    expect(service.completedCount()).toBe(1);
    expect(service.bookmarkedCount()).toBe(1);
    expect(service.difficultCount()).toBe(1);

    service.toggleCompleted('CARD-1');
    service.toggleBookmarked('CARD-1');
    service.toggleDifficult('CARD-2');

    expect(service.isCompleted('CARD-1')).toBe(false);
    expect(service.isBookmarked('CARD-1')).toBe(false);
    expect(service.isDifficult('CARD-2')).toBe(false);
    expect(service.completedCount()).toBe(0);
    expect(service.bookmarkedCount()).toBe(0);
    expect(service.difficultCount()).toBe(0);
  });

  it('prevents duplicate IDs from toggles', () => {
    createService();
    service.toggleCompleted('CARD-1');
    service.toggleCompleted('CARD-1');
    service.toggleCompleted('CARD-1');

    expect(service.progress().completedCardIds).toEqual(['CARD-1']);
  });

  it('clears progress state', () => {
    createService();
    service.toggleCompleted('CARD-1');
    service.toggleBookmarked('CARD-2');
    service.toggleDifficult('CARD-3');
    service.setLastStudied('topic-1', 'CARD-3');

    service.clearProgress();

    const progress = service.progress();
    expect(progress.completedCardIds).toEqual([]);
    expect(progress.bookmarkedCardIds).toEqual([]);
    expect(progress.difficultCardIds).toEqual([]);
    expect(progress.lastStudiedTopicId).toBeNull();
    expect(progress.lastStudiedCardId).toBeNull();
    expect(Number.isNaN(Date.parse(progress.updatedAt))).toBe(false);
  });

  it('persists every mutation', () => {
    createService();
    service.toggleCompleted('CARD-1');
    service.toggleBookmarked('CARD-2');
    service.toggleDifficult('CARD-3');
    service.setLastStudied('topic-9', 'CARD-9');
    service.clearProgress();

    expect(setJsonSpy).toHaveBeenCalledTimes(5);
    for (const call of setJsonSpy.mock.calls) {
      const key = call[0];
      expect(key).toBe('aws-ai-revision.study-progress.v1');
    }
  });
});
