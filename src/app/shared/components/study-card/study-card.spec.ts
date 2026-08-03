import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { StudyCard as StudyCardModel } from '../../../core/models/study-card.model';
import { StudyCardComponent } from './study-card';

describe('StudyCardComponent', () => {
  let component: StudyCardComponent;
  let fixture: ComponentFixture<StudyCardComponent>;

  const cardFixture: StudyCardModel = {
    id: 'AI-INTRO-007',
    topicId: 'introduction-to-ai',
    title: 'AI, ML, Deep Learning and Generative AI',
    summary: 'Understand the relationship between increasingly specialized AI areas.',
    keyPoints: ['AI is broad', 'ML is a subset', 'Deep learning uses layered networks'],
    cardType: 'comparison',
    difficulty: 'medium',
    importance: 'high',
    order: 7,
    tags: ['AI fundamentals', 'AIF-C01', 'generative AI', 'extra tag'],
    sourcePages: [10, 11],
    examTip: 'Look for scope hierarchy clues in exam options.',
    comparison: [
      {
        label: 'AI',
        description: 'The broadest area.',
      },
      {
        label: 'ML',
        description: 'Learns from data patterns.',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudyCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudyCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', cardFixture);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders card content and optional sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Comparison');
    expect(compiled.textContent).toContain('AI, ML, Deep Learning and Generative AI');
    expect(compiled.textContent).toContain('Look for scope hierarchy clues in exam options.');
    expect(compiled.textContent).toContain('Source pages: 10–11');
    expect(compiled.textContent).toContain('Medium difficulty');
    expect(compiled.textContent).toContain('High importance');

    const renderedTags = compiled.querySelectorAll('[aria-label="Card tags"] mat-chip');
    expect(renderedTags.length).toBe(3);
  });

  it('emits toggle events with next state values', () => {
    const completedSpy = vi.fn();
    const bookmarkedSpy = vi.fn();
    const difficultSpy = vi.fn();

    component.completedChange.subscribe(completedSpy);
    component.bookmarkedChange.subscribe(bookmarkedSpy);
    component.difficultChange.subscribe(difficultSpy);

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    buttons[0].nativeElement.click();
    buttons[1].nativeElement.click();
    buttons[2].nativeElement.click();

    expect(completedSpy).toHaveBeenCalledWith(true);
    expect(bookmarkedSpy).toHaveBeenCalledWith(true);
    expect(difficultSpy).toHaveBeenCalledWith(true);
  });

  it('reflects pressed state in button labels and aria-pressed', async () => {
    fixture.componentRef.setInput('completed', true);
    fixture.componentRef.setInput('bookmarked', true);
    fixture.componentRef.setInput('difficult', true);
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(buttons[0].nativeElement.textContent).toContain('Completed');
    expect(buttons[0].nativeElement.getAttribute('aria-pressed')).toBe('true');

    expect(buttons[1].nativeElement.textContent).toContain('Bookmarked');
    expect(buttons[1].nativeElement.getAttribute('aria-pressed')).toBe('true');

    expect(buttons[2].nativeElement.textContent).toContain('Difficult');
    expect(buttons[2].nativeElement.getAttribute('aria-pressed')).toBe('true');
  });
});
