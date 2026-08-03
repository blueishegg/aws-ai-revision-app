export interface StudyProgress {
  readonly version: number;
  readonly completedCardIds: readonly string[];
  readonly bookmarkedCardIds: readonly string[];
  readonly difficultCardIds: readonly string[];
  readonly lastStudiedTopicId: string | null;
  readonly lastStudiedCardId: string | null;
  /** ISO-8601 timestamp of the latest progress update. */
  readonly updatedAt: string;
}
