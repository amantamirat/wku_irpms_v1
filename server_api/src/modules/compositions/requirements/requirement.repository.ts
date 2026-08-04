import { MemberRequirement, IMemberRequirement } from "./requirement.model";


export class RequirementRepository {


    async create(
        data: Partial<IMemberRequirement> | any
    ) {
        return MemberRequirement.create(data);
    }



    async findAll() {

        return MemberRequirement
            .find()
            .sort({
                createdAt: -1
            });

    }



    async findById(id: string) {
        return MemberRequirement.findById(id);
    }


    async update(id: string, data: Partial<IMemberRequirement | any>) {

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