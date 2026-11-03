

import { ProjectAuth } from "../project.auth";

import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";

import { ProjectStatus } from "../project.model";
import { ProjectComponentRepository } from "./component.repository";
import { IUserRepository } from "../../users/user.repository";
import { CreateProjectComponentDTO, FilterProjectComponents, UpdateProjectComponentDTO } from "./component.dto";

export class ProjectComponentService {

    constructor(
        private readonly componentRepo: ProjectComponentRepository,
        private readonly userRepo: IUserRepository,
        private readonly projectAuth: ProjectAuth
    ) { }


    // ---------------------------------------------------
    // VALIDATE USERS
    // ---------------------------------------------------

    private async validateUsers(
        dto: {
            contributors: (string | any)[];
            //investigator: string | any;
        }
    ) {

        const userIds = [
            ...dto.contributors.map(String),
            // String(dto.investigator),
        ];

        const uniqueUserIds = [...new Set(userIds)];

        for (const userId of uniqueUserIds) {
            const user = await this.userRepo.findById(userId);

            if (!user) {
                throw new AppError(
                    ERROR_CODES.USER_NOT_FOUND
                );
            }
        }
    }


    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(
        dto: CreateProjectComponentDTO,
        userId: string
    ) {

        const {
            project,
        } = dto;

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            String(project),
            userId,
            PERMISSIONS.PROJECT_COMPONENT.CREATE
        );

        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT
            );
        }

        await this.validateUsers(dto);

        return await this.componentRepo.create(dto);
    }





    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------

    async getComponents(
        filter: FilterProjectComponents,
        options?: FilterOptions
    ) {
        return await this.componentRepo.find(
            filter,
            options
        );
    }


    // ---------------------------------------------------
    // GET BY ID
    // ---------------------------------------------------

    async getById(
        id: string,
        options?: FilterOptions
    ) {

        const component =
            await this.componentRepo.findById(
                id,
                options
            );

        if (!component) {
            throw new AppError(
                ERROR_CODES.PROJECT_COMPONENT_NOT_FOUND
            );
        }

        return component;
    }


    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------

    async update(
        dto: UpdateProjectComponentDTO & {
            id: string;
            userId: string;
            data: UpdateProjectComponentDTO;
        }
    ) {

        const {
            id,
            userId,
            data,
        } = dto;

        const component =
            await this.componentRepo.findById(id);

        if (!component) {
            throw new AppError(
                ERROR_CODES.PROJECT_COMPONENT_NOT_FOUND
            );
        }

        const projectId = String(component.project);

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PROJECT_COMPONENT.UPDATE
        );

        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT
            );
        }

        // Validate users only if user fields are being updated.
        if (
            data.contributors !== undefined //||
            //data.investigator !== undefined
        ) {
            await this.validateUsers({
                contributors:
                    data.contributors ?? component.contributors.map(String)
                /*investigator:
                    data.investigator ?? String(component.investigator),*/
            });
        }

        return await this.componentRepo.update(
            id,
            data
        );
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------

    async delete(
        dto: DeleteDto,
        userId: string
    ) {

        const { id } = dto;

        const component =
            await this.componentRepo.findById(id);

        if (!component) {
            throw new AppError(
                ERROR_CODES.PROJECT_COMPONENT_NOT_FOUND
            );
        }

        const projectId = String(component.project);

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PROJECT_COMPONENT.DELETE
        );

        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT
            );
        }

        return await this.componentRepo.delete(id);
    }


    // ---------------------------------------------------
    // DELETE BY PROJECT
    // ---------------------------------------------------

    async deleteByProject(
        projectId: string,
        userId: string
    ) {

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PROJECT_COMPONENT.DELETE
        );

        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT
            );
        }

        return await this.componentRepo.deleteByProject(
            projectId
        );
    }

}
