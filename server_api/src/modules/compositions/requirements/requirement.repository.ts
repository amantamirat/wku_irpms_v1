import { FilterOptions } from "../../../common/dtos/filter.dto";
import { MemberRequirement, IMemberRequirement } from "./requirement.model";

export class RequirementRepository {

    async create(
        data: Partial<IMemberRequirement> | any
    ) {
        return MemberRequirement.create(data);
    }

    async findAll(options?: FilterOptions) {

        let dbQuery = MemberRequirement.find();

        if (options?.populate) {
            dbQuery
                .populate("profile")
                .populate("historyRules.rule");
        }

        return dbQuery.sort({
            createdAt: -1
        });
    }

    async findById(
        id: string,
        options?: FilterOptions
    ) {

        let dbQuery = MemberRequirement.findById(id);

        if (options?.populate) {
            dbQuery
                .populate("profile")
                .populate("historyRules.rule");
        }

        return dbQuery;
    }

    async update(
        id: string,
        data: Partial<IMemberRequirement> | any
    ) {

        return MemberRequirement.findByIdAndUpdate(
            id,
            data,
            {
                new: true
            }
        );
    }

    async delete(id: string) {
        return MemberRequirement.findByIdAndDelete(id);
    }

}