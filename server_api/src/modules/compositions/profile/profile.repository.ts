import { EligibilityProfile, IEligibilityProfile } from "./profile.model";


export class ProfileRepository {

    async create(data: Partial<IEligibilityProfile>) {
        return EligibilityProfile.create(data);
    }

    async findAll() {
        return EligibilityProfile.find().sort({ createdAt: -1 });
    }

    async findById(id: string) {
        return EligibilityProfile.findById(id);
    }

    async update(id: string, data: Partial<IEligibilityProfile>
    ) {
        return EligibilityProfile.findByIdAndUpdate(id, data,
            {
                new: true
            }
        );
    }

    async delete(id: string) {
        return EligibilityProfile.findByIdAndDelete(id);
    }

}


