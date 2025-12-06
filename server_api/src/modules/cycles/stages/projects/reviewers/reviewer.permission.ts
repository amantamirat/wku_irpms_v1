// reviewer.permission.ts
import Applicant from "../../../../applicants/applicant.model";
import { IReviewer } from "./reviewer.model";
import { IReviewerRepository } from "./reviewer.repository";


export class ReviewerPermission {
    constructor(private reviewerRepo: IReviewerRepository) { }

    async validateReviewerPermission(reviewerId: string, userId: string, reviewer?: Partial<IReviewer>) {
        const reviewerDoc = reviewer ?? await this.reviewerRepo.findById(reviewerId);
        if (!reviewerDoc) throw new Error("Invalid reviewer");

        const applicantDoc = await Applicant.findById(reviewerDoc.applicant).lean();
        if (!applicantDoc) throw new Error("Invalid applicant");

       // if (userId !== String(applicantDoc.user)) {
         //   throw new Error("Reviewer Permission denied");
      //  }
        return { reviewerDoc, applicantDoc };
    }

}
