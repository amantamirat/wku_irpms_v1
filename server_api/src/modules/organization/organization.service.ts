import { Unit, AcademicLevel, Classification, Ownership, Category } from "./organization.enum";
import { BaseOrganization } from "./organization.model";




export interface GetOrganizationsOptions {
    type?: Unit;
    parent?: string;
}

export interface CreateOrganizationDto {
    name: string;
    type: Unit;
    academic_level?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
    //address?: Address;
    category?: Category;
    parent?: string;
}

//type NonRootTypes = OrganizationType.organization | OrganizationType.componenet | OrganizationType.focusArea;

export class OrganizationService {       
   

    static async createOrganization(data: CreateOrganizationDto) {
        const { type, ...rest } = data;
        //await this.validateOrganizationHierarchy(data);
        if (!BaseOrganization.discriminators || !BaseOrganization.discriminators[type]) {
            throw new Error(`Invalid organization type: ${type}`);
        }
        const model = BaseOrganization.discriminators[type];
        const createdOrganization = await model.create({ type, ...rest });
        return createdOrganization;
    }

    static async getOrganizations(options: GetOrganizationsOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;      
        return BaseOrganization.find(filter).lean();
    }

    static async updateOrganization(id: string, data: Partial<CreateOrganizationDto>) {
        const organization = await BaseOrganization.findById(id);
        if (!organization) throw new Error("Organization not found");
        //await this.validateOrganizationHierarchy(data);
        if (data.type && data.type !== organization.type) {
            throw new Error("Cannot change organization type");
        }
        Object.assign(organization, data);
        return organization.save(); // triggers pre-save hooks
    }

    static async deleteOrganization(id: string) {
        const organization = await BaseOrganization.findById(id);
        if (!organization) throw new Error("Organization not found");
        return await organization.deleteOne();
    }
}
