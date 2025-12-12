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

  async syncProjectStageStatus(projectStageId: string, projectStage?: Partial<IProjectStage>) {
    // Fetch project stage if not provided
    const stage = projectStage ?? await this.projectStageRepo.findById(projectStageId);
    if (!stage || !stage.status) return;
    const currentStatus = stage.status;
    // Fetch all reviewers
    const reviewers = await this.reviewerRepo.findByProjectStage(projectStageId);
    let newStatus: ProjectStageStatus;
    let totalScore: number | undefined = undefined;
    // 1. No reviewers → pending
    if (reviewers.length === 0) {
      newStatus = ProjectStageStatus.pending;
    }
    else {
      // Check for at least one active reviewer
      const hasActiveOrSubmitted = reviewers.some(
        r => r.status === ReviewerStatus.active || r.status === ReviewerStatus.submitted);
      if (hasActiveOrSubmitted) {
        if (currentStatus === ProjectStageStatus.reviewed) {
          totalScore = 0;
        }
        newStatus = ProjectStageStatus.on_review;
      }
      else {
        const allApproved = reviewers.every(r => r.status === ReviewerStatus.approved);
        if (allApproved) {
          newStatus = ProjectStageStatus.reviewed;
          const totalWeight = reviewers.reduce((sum, r) => sum + (r.weight ?? 1), 0);
          totalScore = reviewers.reduce((sum, r) => sum + (r.score ?? 0) * (r.weight ?? 1), 0) / totalWeight;
          //totalScore = reviewers.reduce((sum, r) => sum + (r.weight ?? 1) * (r.score ?? 0), 0) / reviewers.length;
        }
        else {
          // Otherwise → submitted i.e. every pending → submitted
          newStatus = ProjectStageStatus.submitted;
        }
      }
    }


    // Prepare update payload safely
    const updateData: Partial<IProjectStage> = { status: newStatus };

    // Only attach score when it exists
    if (totalScore !== undefined) {
      updateData.totalScore = totalScore;
    }
    let updatedProjectStage;
    // Update only if allowed by the state machine
    if (ProjectStageStateMachine.canTransition(currentStatus, newStatus)) {
      updatedProjectStage = await this.projectStageRepo.update(projectStageId, updateData);
    }
    return updatedProjectStage;
  }

}
