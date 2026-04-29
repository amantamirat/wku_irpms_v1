// project-document.synchronizer.ts
import { IProjectStageRepository } from "../projects/stages/project.stage.repository";
import { ProjectStageStatus } from "../projects/stages/project.stage.status";
//import { DocumentStateMachine } from "./project.stage.state-machine";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { IGrantStage } from "../grants/stages/grant.stage.model";
import { PROJECT_STAGE_TRANSITIONS } from "../projects/stages/project.stage.service";
import { IReviewerRepository } from "./reviewer.repository";
import { ReviewerStatus } from "./reviewer.state-machine";

export interface IProjectStageSynchronizer {
  sync(projectStageId: string): Promise<any>;
}
export class ReviewerSynchronizer implements IProjectStageSynchronizer {

  constructor(
    private readonly reviewerRepo: IReviewerRepository,
    private readonly projectStageRepo: IProjectStageRepository,
  ) {

  }

  async sync(projectStageId: string) {
    const projectStageDoc = await this.projectStageRepo.findById(projectStageId, true);
    if (!projectStageDoc || !projectStageDoc.status) return;

    const grantStageDoc = projectStageDoc.grantStage as unknown as IGrantStage;
    const minReviewers = grantStageDoc.minReviewers;

    const reviewers = await this.reviewerRepo.find({ projectStage: projectStageId });
    const approvedReviewers = reviewers.filter(
      r => r.status === ReviewerStatus.approved
    );
    let newScore: number | null = null;
    let newStatus: ProjectStageStatus = ProjectStageStatus.selected;
    if (approvedReviewers.length >= minReviewers) {
      const totalWeight = approvedReviewers.reduce((sum, r) => sum + (r.weight ?? 1), 0);
      newScore = approvedReviewers.reduce(
        (sum, r) => sum + (r.score ?? 0) * (r.weight ?? 1),
        0
      ) / totalWeight;
      newStatus = ProjectStageStatus.reviewed;
    }
    const currentScore = projectStageDoc.totalScore;
    if (newScore !== currentScore) {
      await this.projectStageRepo.update(projectStageId, {
        totalScore: newScore
      });
    }
    const currentStatus = projectStageDoc.status;
    if (newStatus !== currentStatus) {
      TransitionHelper.validateTransition(
        currentStatus,
        newStatus,
        PROJECT_STAGE_TRANSITIONS
      );

      const updated = await this.projectStageRepo.updateStatus(projectStageId, newStatus);
      return updated;

    }

  }

}
