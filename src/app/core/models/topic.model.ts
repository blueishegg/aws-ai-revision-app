export interface Topic {
  readonly id: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly icon: string;
  readonly order: number;
  readonly enabled: boolean;
  readonly estimatedMinutes: number;
  readonly cardCount: number;
  readonly tags: readonly string[];
}
