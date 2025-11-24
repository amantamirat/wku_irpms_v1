// collaborator.permission.ts
import Applicant from "../../applicants/applicant.model";
import { ICollaborator } from "./collaborator.model";
import { ICollaboratorRepository } from "./collaborator.repository";


export class CollaboratorPermission {
    constructor(private collaboratorRepo: ICollaboratorRepository) { }

    async validateCollaboratorPermission(collaboratorId: string, userId: string, collaborator?: Partial<ICollaborator>) {
        const collaboratorDoc = collaborator ?? await this.collaboratorRepo.findById(collaboratorId);
        if (!collaboratorDoc) throw new Error("Invalid collaborator");

        const applicantDoc = await Applicant.findById(collaboratorDoc.applicant).lean();
        if (!applicantDoc) throw new Error("Invalid applicant");

        if (userId !== String(applicantDoc.user)) {
            throw new Error("Collaborator Permission denied");
        }
        return { collaboratorDoc, applicantDoc };
    }

}
