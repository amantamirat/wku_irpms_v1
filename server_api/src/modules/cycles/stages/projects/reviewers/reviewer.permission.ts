// reviewer.permission.ts
import Applicant from "../../../../applicants/applicant.model";
import { IReviewerRepository } from "./reviewer.repository";


export class ReviewerPermission {
    constructor(private reviewerRepo: IReviewerRepository) { }

    async validateReviewerPermission(reviewerId: string, userId: string) {
        const reviewerDoc = await this.reviewerRepo.findById(reviewerId);
        if (!reviewerDoc) throw new Error("Invalid reviewer");

        const applicantDoc = await Applicant.findById(reviewerDoc.applicant).lean();
        if (!applicantDoc) throw new Error("Invalid applicant");

        if (userId !== String(applicantDoc._id)) {
            throw new Error("Permission denied");
        }
        return { reviewerDoc, applicantDoc };
    }

}
