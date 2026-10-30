import mongoose from "mongoose";
import { FilterOptions } from "../../../../common/dtos/filter.dto";
import { FilterPhaseDocDTO } from "./phase.doc.dto";
import {
    ProjectDocumentStatus,
    IProjectDocument,
    ProjectDocument,
    PhaseDocumentType
} from "./phase.doc.model";

export interface CreatePhaseDocData {
    project: string;
    phase?: string;
    activity?: string;
    type: PhaseDocumentType;
    description: string;
    documentPath: string;
    createdBy?: string;
}

export interface IPhaseDocumentRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProjectDocument | null>;

    find(
        filters: FilterPhaseDocDTO,
        options?: FilterOptions
    ): Promise<Partial<IProjectDocument>[]>;

    exists(
        filter: FilterPhaseDocDTO
    ): Promise<boolean>;

    create(
        dto: CreatePhaseDocData
    ): Promise<IProjectDocument>;

    updateStatus(
        id: string,
        status: ProjectDocumentStatus,
        userId: string,
        reason?: string,
    ): Promise<IProjectDocument | null>;

    delete(
        id: string
    ): Promise<IProjectDocument | null>;
}

export class PhaseDocumentRepository
    implements IPhaseDocumentRepository {

    private buildQuery(filters: FilterPhaseDocDTO) {
        const query: Record<string, any> = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(filters.phase);
        }

        if (filters.activity) {
            query.activity = new mongoose.Types.ObjectId(filters.activity);
        }

        if (filters.type) {
            query.type = filters.type;
        }
        
        if (filters.status) {
            query.status = filters.status;
        }

        return query;
    }

    async findById(
        id: string,
        options?: FilterOptions
    ) {
        const query = ProjectDocument.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            query.populate("project phase activity");
        }

        return query
            .lean<IProjectDocument>()
            .exec();
    }

    async find(
        filters: FilterPhaseDocDTO,
        options?: FilterOptions
    ) {
        const dbQuery = ProjectDocument.find(
            this.buildQuery(filters)
        );

        if (options?.populate) {
            dbQuery.populate("project phase activity");
        }

        return dbQuery
            .lean<IProjectDocument[]>()
            .exec();
    }

    async exists(
        filters: FilterPhaseDocDTO
    ): Promise<boolean> {
        const exists = await ProjectDocument.exists(
            this.buildQuery(filters)
        );

        return !!exists;
    }

    async create(
        dto: CreatePhaseDocData
    ) {
        return ProjectDocument.create({
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
            ...(dto.phase && {
                phase: new mongoose.Types.ObjectId(dto.phase)
            }),
            ...(dto.activity && {
                activity: new mongoose.Types.ObjectId(dto.activity)
            }),
            ...(dto.createdBy && {
                createdBy: new mongoose.Types.ObjectId(dto.createdBy)
            })
        });
    }


    async updateStatus(
        id: string,
        status: ProjectDocumentStatus,
        userId: string,
        reason?: string
    ): Promise<IProjectDocument | null> {

        return ProjectDocument.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy: new mongoose.Types.ObjectId(userId),
                        changedAt: new Date(),
                        reason
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).exec();
    }

    async delete(id: string) {
        return ProjectDocument.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}