import mongoose from "mongoose";
import { Theme, ITheme } from "./theme.model";
import {
    CreateThemeDTO,
    FilterThemeDTO,
    UpdateThemeDTO
} from "./theme.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";

type DeleteThemeFilter = Pick<
    FilterThemeDTO,
    "thematicArea" | "parent"
>;

export interface IThemeRepository {
    findById(
        id: string,
        options?: FilterOptions
    ): Promise<ITheme | null>;

    find(
        filters?: FilterThemeDTO,
        options?: FilterOptions
    ): Promise<ITheme[]>;

    findOne(
        filters?: FilterThemeDTO,
        options?: FilterOptions
    ): Promise<ITheme | null>;

    create(dto: CreateThemeDTO): Promise<ITheme>;

    update(
        id: string,
        data: UpdateThemeDTO["data"]
    ): Promise<ITheme | null>;

    exists(
        filters: FilterThemeDTO
    ): Promise<boolean>;

    deleteMany(
        filter: DeleteThemeFilter
    ): Promise<any>;

    delete(
        id: string
    ): Promise<ITheme | null>;
}

export class ThemeRepository implements IThemeRepository {

    private buildFilter(
        filters: FilterThemeDTO = {}
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.thematicArea) {
            query.thematicArea = new mongoose.Types.ObjectId(
                filters.thematicArea
            );
        }

        if (filters.parent) {
            query.parent = new mongoose.Types.ObjectId(
                filters.parent
            );
        }

        if (filters.level !== undefined) {
            query.level = filters.level;
        }

        if (filters.title) {
            query.title = filters.title;
        }

        return query;
    }

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<ITheme | null> {

        let dbQuery = Theme.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            dbQuery
                .populate("parent")
                .populate("thematicArea");
        }

        return dbQuery
            .lean<ITheme>()
            .exec();
    }

    async find(
        filters: FilterThemeDTO = {},
        options?: FilterOptions
    ): Promise<ITheme[]> {

        const query = this.buildFilter(filters);

        let dbQuery = Theme.find(query);

        if (options?.populate) {
            dbQuery
                .populate("parent")
                .populate("thematicArea");
        }

        return dbQuery
            .lean<ITheme[]>()
            .exec();
    }

    async findOne(
        filters: FilterThemeDTO = {},
        options?: FilterOptions
    ): Promise<ITheme | null> {

        const query = this.buildFilter(filters);

        let dbQuery = Theme.findOne(query);

        if (options?.populate) {
            dbQuery
                .populate("parent")
                .populate("thematicArea");
        }

        return dbQuery
            .lean<ITheme>()
            .exec();
    }

    async create(
        dto: CreateThemeDTO
    ): Promise<ITheme> {

        const data = {
            ...dto,
            thematicArea: new mongoose.Types.ObjectId(
                dto.thematicArea
            ),
            ...(dto.parent && {
                parent: new mongoose.Types.ObjectId(dto.parent)
            })
        };

        return Theme.create(data);
    }

    async update(
        id: string,
        dtoData: UpdateThemeDTO["data"]
    ): Promise<ITheme | null> {

        const updateData: Partial<ITheme> = {};

        if (dtoData.title !== undefined) {
            updateData.title = dtoData.title;
        }

        if (dtoData.priority !== undefined) {
            updateData.priority = dtoData.priority;
        }

        return Theme.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        )
            .lean<ITheme>()
            .exec();
    }

    async exists(
        filters: FilterThemeDTO
    ): Promise<boolean> {
        const query = this.buildFilter(filters);
        const result = await Theme.exists(query).exec();
        return result !== null;
    }

    async deleteMany(
        filters: DeleteThemeFilter
    ): Promise<any> {
        return Theme.deleteMany(
            this.buildFilter(filters)
        ).exec();
    }

    async delete(
        id: string
    ): Promise<ITheme | null> {

        return Theme.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<ITheme>()
            .exec();
    }
}
