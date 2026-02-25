// project-document.synchronizer.ts
import { IDocumentRepository } from "./document.repository";
import { DocStatus } from "./document.status";
import { DocumentStateMachine } from "./document.state-machine";
import { IProjectDocument } from "./document.model";
import { IReviewerRepository } from "../../calls/stages/reviewers/reviewer.repository";
import { ReviewerStatus } from "../../calls/stages/reviewers/reviewer.status";

export class DocumentSynchronizer {

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly reviewerRepository: IReviewerRepository
  ) {

  }

  async sync(docId: string) {
    const proDoc = await this.documentRepository.findById(docId);
    if (!proDoc || !proDoc.status) return;

    const currentStatus = proDoc.status;
    const reviewers = await this.reviewerRepository.find({ projectStage: docId });

    let newStatus: DocStatus = DocStatus.selected;

    let totalScore: number | undefined | null = undefined;

    if (reviewers.length > 0) {
      const allApproved = reviewers.every(r => r.status === ReviewerStatus.approved);
      if (allApproved) {
        newStatus = DocStatus.reviewed;
        const totalWeight = reviewers.reduce((sum, r) => sum + (r.weight ?? 1), 0);
        totalScore = reviewers.reduce((sum, r) => sum + (r.score ?? 0) * (r.weight ?? 1), 0) / totalWeight;
      } else {
        totalScore = null;
      }
    }

    if (newStatus !== currentStatus && DocumentStateMachine.canTransition(currentStatus, newStatus)) {
      const updateData: any = { status: newStatus };
      if (totalScore !== undefined) {
        updateData.totalScore = totalScore;
      }
      const updated = await this.documentRepository.update(docId, updateData);
      return updated;
    }

  }

}
