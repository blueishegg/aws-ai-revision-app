import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BrowserStorageService } from './browser-storage';

describe('BrowserStorageService', () => {
  let service: BrowserStorageService;
  const testKey = '__browser-storage-spec__';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowserStorageService);
    window.localStorage.removeItem(testKey);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem(testKey);
  });

  it('returns fallback for a missing key', () => {
    const fallback = { value: 'fallback' };

    expect(service.getJson(testKey, fallback)).toEqual(fallback);
  });

  it('returns parsed value for valid stored JSON', () => {
    window.localStorage.setItem(testKey, JSON.stringify({ value: 'stored' }));

    expect(service.getJson(testKey, { value: 'fallback' })).toEqual({ value: 'stored' });
  });

  it('returns fallback for malformed JSON', () => {
    const fallback = ['safe'];
    window.localStorage.setItem(testKey, '{invalid-json');

    expect(service.getJson(testKey, fallback)).toEqual(fallback);
  });

  it('saves JSON successfully', () => {
    const success = service.setJson(testKey, { saved: true });

    expect(success).toBe(true);
    expect(window.localStorage.getItem(testKey)).toBe('{"saved":true}');
  });

  it('returns fallback and false when storage access fails', () => {
    const fallback = { value: 'fallback' };
    const localStorageGetterSpy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(service.getJson(testKey, fallback)).toEqual(fallback);
    expect(service.setJson(testKey, { value: 'x' })).toBe(false);
    expect(service.remove(testKey)).toBe(false);
    expect(localStorageGetterSpy).toHaveBeenCalled();
  });
});
