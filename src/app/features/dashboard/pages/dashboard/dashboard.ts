import { computed, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../../../core/services/content';
import { StudyProgressService } from '../../../../core/services/study-progress';

@Component({
  selector: 'app-dashboard',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly content = inject(ContentService);
  private readonly progress = inject(StudyProgressService);

  protected readonly completedCount = this.progress.completedCount;
  protected readonly bookmarkedCount = this.progress.bookmarkedCount;
  protected readonly difficultCount = this.progress.difficultCount;

  protected readonly lastStudiedTopic = computed(() => {
    const topicId = this.progress.progress().lastStudiedTopicId;
    if (!topicId) {
      return null;
    }

    return this.content.getTopicById(topicId) ?? null;
  });

  protected readonly hasLastStudiedTopic = computed(() => this.lastStudiedTopic() !== null);

  protected readonly startStudyingLink = computed<readonly string[]>(() => {
    const topic = this.lastStudiedTopic();
    return topic ? ['/study', topic.id] : ['/topics'];
  });

  protected readonly continueStudyingLink = computed<readonly string[]>(() => {
    const topic = this.lastStudiedTopic();
    return topic ? ['/study', topic.id] : ['/topics'];
  });

  constructor() {
    void this.content.loadContent();
  }
}
