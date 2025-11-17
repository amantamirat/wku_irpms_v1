// project-stage.synchronizer.ts
import { IProjectStageRepository } from "./project-stage.repository";
import { ProjectStageStatus } from "./project-stage.enum";
import { ProjectStageStateMachine } from "./project-stage.state-machine";
import { IProjectStage } from "./project-stage.model";
import { IReviewerRepository } from "./reviewers/reviewer.repository";

export class ProjectStageSynchronizer {
  private projectStageRepo: IProjectStageRepository;
  private reviewerRepo: IReviewerRepository;

  constructor(projectStageRepo: IProjectStageRepository, reviewerRepo: IReviewerRepository) {
    this.projectStageRepo = projectStageRepo;
    this.reviewerRepo = reviewerRepo;
  }


  async onReviewerCreated(projectStageId: string, projectStage?: Partial<IProjectStage>) {
    const stage = projectStage ?? await this.projectStageRepo.findById(projectStageId);
    if (!stage || !stage.status) return;
    const newStatus = ProjectStageStatus.on_review;
    if (ProjectStageStateMachine.canTransition(stage.status, newStatus)) {
      await this.projectStageRepo.updateState(projectStageId, { status: newStatus });
    }
  }


  async onReviewerDeleted(projectStageId: string, projectStage?: Partial<IProjectStage>): Promise<void> {

    const hasActiveReviewer = await this.reviewerRepo.existsActiveByProjectStage(projectStageId);
    if (hasActiveReviewer) return;

    // Use passed projectStage or fetch from repo
    const stage = projectStage ?? await this.projectStageRepo.findById(projectStageId);
    if (!stage || !stage.status) return;

    const newStatus = ProjectStageStatus.submitted;
    if (ProjectStageStateMachine.canTransition(stage.status, newStatus)) {
      await this.projectStageRepo.updateState(projectStageId, { status: newStatus });
    }

  }



}
