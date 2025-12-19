// project-document.synchronizer.ts
import { IDocumentRepository } from "./document.repository";
import { ProjectDocStatus } from "./document.enum";
import { DocumentStateMachine } from "./document.state-machine";
import { IProjectDocument } from "./document.model";
import { IReviewerRepository } from "./reviewers/reviewer.repository";
import { ReviewerStatus } from "./reviewers/reviewer.enum";

export class ProjectStageSynchronizer {
  private projectStageRepo: IDocumentRepository;
  private reviewerRepo: IReviewerRepository;

  constructor(projectStageRepo: IDocumentRepository, reviewerRepo: IReviewerRepository) {
    this.projectStageRepo = projectStageRepo;
    this.reviewerRepo = reviewerRepo;
  }

  async syncProjectStageStatus(projectStageId: string, projectStage?: Partial<IProjectDocument>) {
    // Fetch project stage if not provided
    const stage = projectStage ?? await this.projectStageRepo.findById(projectStageId);
    if (!stage || !stage.status) return;
    const currentStatus = stage.status;
    // Fetch all reviewers
    const reviewers = await this.reviewerRepo.findByProjectStage(projectStageId);
    let newStatus: ProjectDocStatus;
    let totalScore: number | undefined = undefined;
    // 1. No reviewers → pending
    if (reviewers.length === 0) {
      newStatus = ProjectDocStatus.pending;
    }
    //else {
      /**
       * 
       *  // Check for at least one active reviewer
      const hasActiveOrSubmitted = reviewers.some(
        r => r.status === ReviewerStatus.active || r.status === ReviewerStatus.submitted);
      if (hasActiveOrSubmitted) {
        if (currentStatus === ProjectDocStatus.reviewed) {
          totalScore = 0;
        }
        newStatus = ProjectDocStatus.on_review;
      }
       */
     
      else {
        const allApproved = reviewers.every(r => r.status === ReviewerStatus.approved);
        if (allApproved) {
          newStatus = ProjectDocStatus.reviewed;
          const totalWeight = reviewers.reduce((sum, r) => sum + (r.weight ?? 1), 0);
          totalScore = reviewers.reduce((sum, r) => sum + (r.score ?? 0) * (r.weight ?? 1), 0) / totalWeight;
          //totalScore = reviewers.reduce((sum, r) => sum + (r.weight ?? 1) * (r.score ?? 0), 0) / reviewers.length;
        }
        else {
          // Otherwise → submitted i.e. every pending → submitted
          newStatus = ProjectDocStatus.submitted;
        }
      }
   // }


    // Prepare update payload safely
    const updateData: Partial<IProjectDocument> = { status: newStatus };

    // Only attach score when it exists
    if (totalScore !== undefined) {
      updateData.totalScore = totalScore;
    }
    let updatedProjectStage;
    // Update only if allowed by the state machine
    if (DocumentStateMachine.canTransition(currentStatus, newStatus)) {
      updatedProjectStage = await this.projectStageRepo.update(projectStageId, updateData);
    }
    return updatedProjectStage;
  }

}
