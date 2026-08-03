import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BrowserStorageService {
  getJson<T>(key: string, fallback: T): T {
    const storage = this.getStorage();
    if (!storage) {
      return fallback;
    }

    try {
      const rawValue = storage.getItem(key);
      if (rawValue === null) {
        return fallback;
      }

      return JSON.parse(rawValue) as T;
    } catch {
      return fallback;
    }
  }

  setJson<T>(key: string, value: T): boolean {
    const storage = this.getStorage();
    if (!storage) {
      return false;
    }

    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    const storage = this.getStorage();
    if (!storage) {
      return false;
    }

    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
}
