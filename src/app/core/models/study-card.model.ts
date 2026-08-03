export const STUDY_CARD_TYPES = [
  'definition',
  'process',
  'comparison',
  'examples',
  'timeline',
  'exam-tip',
] as const;

export type StudyCardType = (typeof STUDY_CARD_TYPES)[number];

export const STUDY_CARD_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export type StudyCardDifficulty = (typeof STUDY_CARD_DIFFICULTIES)[number];

export const STUDY_CARD_IMPORTANCE = ['low', 'medium', 'high'] as const;

export type StudyCardImportance = (typeof STUDY_CARD_IMPORTANCE)[number];

export interface StudyComparisonItem {
  readonly label: string;
  readonly description: string;
}

export interface StudyCard {
  readonly id: string;
  readonly topicId: string;
  readonly title: string;
  readonly summary: string;
  readonly keyPoints: readonly string[];
  readonly cardType: StudyCardType;
  readonly difficulty: StudyCardDifficulty;
  readonly importance: StudyCardImportance;
  readonly order: number;
  readonly tags: readonly string[];
  /** Source material page references for this card. */
  readonly sourcePages: readonly number[];
  readonly examTip?: string;
  readonly comparison?: readonly StudyComparisonItem[];
}
