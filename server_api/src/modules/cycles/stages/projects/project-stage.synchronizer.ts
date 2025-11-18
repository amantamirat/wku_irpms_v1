// project-stage.synchronizer.ts
import { IProjectStageRepository } from "./project-stage.repository";
import { ProjectStageStatus } from "./project-stage.enum";
import { ProjectStageStateMachine } from "./project-stage.state-machine";
import { IProjectStage } from "./project-stage.model";
import { IReviewerRepository } from "./reviewers/reviewer.repository";
import { ReviewerStatus } from "./reviewers/reviewer.enum";

export class ProjectStageSynchronizer {
  private projectStageRepo: IProjectStageRepository;
  private reviewerRepo: IReviewerRepository;

  constructor(projectStageRepo: IProjectStageRepository, reviewerRepo: IReviewerRepository) {
    this.projectStageRepo = projectStageRepo;
    this.reviewerRepo = reviewerRepo;
  }

  async syncProjectStageStatus(projectStageId: string, projectStage?: Partial<IProjectStage>): Promise<void> {
    // Fetch project stage if not provided
    const stage = projectStage ?? await this.projectStageRepo.findById(projectStageId);
    if (!stage || !stage.status) return;

    // Fetch all reviewers
    const reviewers = await this.reviewerRepo.findByProjectStage(projectStageId);

    let newStatus: ProjectStageStatus;

    // 1. No reviewers → pending
    if (reviewers.length === 0) {
      newStatus = ProjectStageStatus.pending;

    } else {
      // Check for at least one active reviewer
      const hasActive = reviewers.some(r => r.status === ReviewerStatus.active);

      if (hasActive) {
        // 2. At least one active reviewer → on_review
        newStatus = ProjectStageStatus.on_review;
      } else {
        // 3. Otherwise → submitted
        newStatus = ProjectStageStatus.submitted;
      }
    }

    // Update only if allowed by the state machine
    if (ProjectStageStateMachine.canTransition(stage.status, newStatus)) {
      await this.projectStageRepo.updateState(projectStageId, { status: newStatus });
    }
  }

}
