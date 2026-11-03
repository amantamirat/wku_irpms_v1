
import { FilterQuery } from "mongoose";
import { CreateProjectComponentDTO, FilterProjectComponents, ProjectComponentDto, UpdateProjectComponentDTO } from "./component.dto";
import { IProjectComponent, ProjectComponent } from "./component.model";
import { FilterOptions } from "../../../common/dtos/filter.dto";




export class ProjectComponentRepository {

    async create(
        dto: CreateProjectComponentDTO
    ): Promise<IProjectComponent> {
        return await ProjectComponent.create(dto);
    }    

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProjectComponent | null> {
        let query = ProjectComponent.findById(id);

        if (options?.populate) {
            query = query
                .populate("project")
                .populate("contributors")
            //.populate("investigator");
        }

        return await query;
    }

    async find(
        filters: FilterProjectComponents,
        options?: FilterOptions
    ): Promise<IProjectComponent[]> {

        let query = ProjectComponent.find(
            filters as FilterQuery<IProjectComponent>
        );

        if (options?.populate) {
            query = query
                .populate("project")
                .populate("contributors")
            //.populate("investigator");
        }

        return await query.sort({ title: 1 });
    }

    async findOne(
        filters: FilterQuery<IProjectComponent>,
        options?: FilterOptions
    ): Promise<IProjectComponent | null> {

        let query = ProjectComponent.findOne(filters);

        if (options?.populate) {
            query = query
                .populate("project")
                .populate("contributors")
            //.populate("investigator");
        }

        return await query;
    }

    async update(
        id: string,
        data: UpdateProjectComponentDTO
    ): Promise<IProjectComponent | null> {
        return await ProjectComponent.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async delete(id: string): Promise<IProjectComponent | null> {
        return await ProjectComponent.findByIdAndDelete(id);
    }

    async deleteByProject(projectId: string): Promise<number> {
        const result = await ProjectComponent.deleteMany({
            project: projectId,
        });

        return result.deletedCount ?? 0;
    }

    async count(
        filters: FilterQuery<IProjectComponent> = {}
    ): Promise<number> {
        return await ProjectComponent.countDocuments(filters);
    }
}
