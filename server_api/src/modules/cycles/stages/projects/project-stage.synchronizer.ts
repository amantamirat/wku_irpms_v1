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

    // Fetch all reviewers for the project stage
    const reviewers = await this.reviewerRepo.findByProjectStage(projectStageId);

    let newStatus: ProjectStageStatus;

    if (reviewers.length === 0) {
      // No reviewers linked
      newStatus = ProjectStageStatus.submitted;
    } else if (reviewers.every(r => r.status === ReviewerStatus.approved)) {
      // All reviewers approved
      newStatus = ProjectStageStatus.reviewed;
    } else {
      // At least one reviewer not approved
      newStatus = ProjectStageStatus.on_review;
    }

    // Only update if transition is allowed
    if (ProjectStageStateMachine.canTransition(stage.status, newStatus)) {
      await this.projectStageRepo.updateState(projectStageId, { status: newStatus });
    }
  }







}
