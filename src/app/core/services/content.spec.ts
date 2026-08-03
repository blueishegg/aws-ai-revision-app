import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StudyCard } from '../models/study-card.model';
import { Topic } from '../models/topic.model';

import { ContentService } from './content';

describe('ContentService', () => {
  let service: ContentService;
  let httpMock: HttpTestingController;

  const topicsFixture: readonly Topic[] = [
    {
      id: 'disabled-topic',
      title: 'Disabled Topic',
      shortTitle: 'Disabled',
      description: 'Disabled topic for filtering tests.',
      icon: 'block',
      order: 1,
      enabled: false,
      estimatedMinutes: 5,
      cardCount: 1,
      tags: ['disabled'],
    },
    {
      id: 'introduction-to-ai',
      title: 'Introduction to Artificial Intelligence',
      shortTitle: 'Introduction to AI',
      description: 'Enabled topic.',
      icon: 'psychology',
      order: 2,
      enabled: true,
      estimatedMinutes: 10,
      cardCount: 2,
      tags: ['ai'],
    },
  ];

  const cardsFixture: readonly StudyCard[] = [
    {
      id: 'CARD-2',
      topicId: 'introduction-to-ai',
      title: 'Second',
      summary: 'Second card summary.',
      keyPoints: ['k2'],
      cardType: 'definition',
      difficulty: 'easy',
      importance: 'medium',
      order: 2,
      tags: ['ai'],
      sourcePages: [11],
    },
    {
      id: 'OTHER-1',
      topicId: 'disabled-topic',
      title: 'Other',
      summary: 'Other card summary.',
      keyPoints: ['ko'],
      cardType: 'examples',
      difficulty: 'medium',
      importance: 'low',
      order: 1,
      tags: ['other'],
      sourcePages: [12],
    },
    {
      id: 'CARD-1',
      topicId: 'introduction-to-ai',
      title: 'First',
      summary: 'First card summary.',
      keyPoints: ['k1'],
      cardType: 'definition',
      difficulty: 'easy',
      importance: 'high',
      order: 1,
      tags: ['ai'],
      sourcePages: [10],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads topics and cards successfully', async () => {
    const topicsRequest = httpMock.expectOne('/data/topics.json');
    const cardsRequest = httpMock.expectOne('/data/study-cards.json');

    topicsRequest.flush(topicsFixture);
    cardsRequest.flush(cardsFixture);

    await service.loadContent();

    expect(service.errorMessage()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.topics().length).toBe(2);
    expect(service.cards().length).toBe(3);

    await service.loadContent();

    httpMock.expectNone('/data/topics.json');
    httpMock.expectNone('/data/study-cards.json');
  });

  it('orders and filters computed data and lookup methods', async () => {
    const topicsRequest = httpMock.expectOne('/data/topics.json');
    const cardsRequest = httpMock.expectOne('/data/study-cards.json');

    topicsRequest.flush(topicsFixture);
    cardsRequest.flush(cardsFixture);

    await service.loadContent();

    expect(service.enabledTopics().map((topic) => topic.id)).toEqual(['introduction-to-ai']);
    expect(service.getTopicById('introduction-to-ai')?.title).toBe(
      'Introduction to Artificial Intelligence',
    );
    expect(service.getCardById('CARD-1')?.title).toBe('First');
    expect(service.getCardsByTopicId('introduction-to-ai').map((card) => card.id)).toEqual([
      'CARD-1',
      'CARD-2',
    ]);
  });

  it('sets error state when loading fails', async () => {
    const topicsRequest = httpMock.expectOne('/data/topics.json');
    const cardsRequest = httpMock.expectOne('/data/study-cards.json');

    topicsRequest.flush('Server error', {
      status: 500,
      statusText: 'Server Error',
    });
    expect(cardsRequest.cancelled).toBe(true);

    await service.loadContent();

    expect(service.loading()).toBe(false);
    expect(service.topics()).toEqual([]);
    expect(service.cards()).toEqual([]);
    expect(service.errorMessage()).toBe('Unable to load revision content at this time.');
  });
});
