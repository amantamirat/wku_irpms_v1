import {
    EligibilityProfile,
    IEligibilityProfile
} from "./profile.model";


export class ProfileRepository {

    async create(
        data: Partial<IEligibilityProfile>
    ): Promise<IEligibilityProfile> {

        return EligibilityProfile.create(data);
    }


    async findAll(): Promise<IEligibilityProfile[]> {

        return EligibilityProfile
            .find()
            .sort({
                createdAt: -1
            });
    }


    async findById(
        id: string
    ): Promise<IEligibilityProfile | null> {

        return EligibilityProfile.findById(id);
    }


    async findByName(
        name: string,
        excludeId?: string
    ): Promise<IEligibilityProfile | null> {

        const query: {
            name: string;
            _id?: { $ne: string };
        } = {
            name
        };

        if (excludeId) {
            query._id = {
                $ne: excludeId
            };
        }

        return EligibilityProfile.findOne(query);
    }


    async update(
        id: string,
        data: Partial<IEligibilityProfile>
    ): Promise<IEligibilityProfile | null> {

        return EligibilityProfile.findByIdAndUpdate(
            id,
            data,
            {
                new: true
            }
        );
    }


    async delete(
        id: string
    ): Promise<IEligibilityProfile | null> {

        return EligibilityProfile.findByIdAndDelete(id);
    }

}