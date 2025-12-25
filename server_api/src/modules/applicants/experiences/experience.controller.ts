import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../users/user.middleware";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { ExperienceService } from "./experience.service";
import {
    CreateExperienceDTO,
    UpdateExperienceDTO,
    GetExperiencesDTO,
    DeleteExperienceDTO
} from "./experience.dto";



const experienceService = new ExperienceService();

export class ExperienceController {

    // --- Create Experience ---
    static async createExperience(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const {
                applicant,
                jobTitle,
                organization,
                rank,
                startDate,
                endDate,
                isCurrent,
                employmentType
            } = req.body;

            const dto: CreateExperienceDTO = {
                applicantId: applicant,
                jobTitle,
                organizationId: organization,
                rankId: rank,
                startDate,
                endDate,
                isCurrent,
                employmentType,
                userId: req.user.userId
            };

            const created = await experienceService.createExperience(dto);
            successResponse(res, 201, "Experience created successfully", created);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // --- List Experiences by Applicant ---
    static async getExperiences(req: Request, res: Response) {
        try {
            const { applicant } = req.query;
            if (!applicant) throw new Error("applicant is required");

            const filter: GetExperiencesDTO = {
                applicantId: String(applicant)
            };

            const experiences = await experienceService.getExperiences(filter);
            successResponse(res, 200, "Experiences fetched successfully", experiences);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // --- Update Experience ---
    static async updateExperience(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;

            const {
                jobTitle,
                organization,
                rank,
                startDate,
                endDate,
                isCurrent,
                employmentType
            } = req.body;

            const dto: UpdateExperienceDTO = {
                id,
                data: {
                    jobTitle: jobTitle ?? undefined,
                    organizationId: organization ?? undefined,
                    rankId: rank ?? undefined,
                    startDate: startDate ?? undefined,
                    endDate: endDate ?? undefined,
                    isCurrent: isCurrent ?? undefined,
                    employmentType: employmentType ?? undefined
                },
                userId: req.user.userId
            };

            const updated = await experienceService.updateExperience(dto);
            successResponse(res, 200, "Experience updated successfully", updated);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // --- Delete Experience ---
    static async deleteExperience(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;

            const dto: DeleteExperienceDTO = {
                id,
                userId: req.user.userId
            };

            const deleted = await experienceService.deleteExperience(dto);
            successResponse(res, 200, "Experience deleted successfully", deleted);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
