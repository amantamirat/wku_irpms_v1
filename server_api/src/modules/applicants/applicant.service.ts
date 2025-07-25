import Applicant from './applicant.model';
import Organization, { OrganizationType } from '../organizations/organization.model';
import { Scope } from './applicant.model';

const scopeToOrganizationType: Record<Scope, OrganizationType> = {
    academic: OrganizationType.Department,
    supportive: OrganizationType.Supportive,
    external: OrganizationType.External,
};

const validateApplicantOrganization = async (scope: Scope, orgId: string) => {
    const expected = scopeToOrganizationType[scope];
    const org = await Organization.findById(orgId);
    if (!org || org.type !== expected) {
        throw new Error(`Scope ${scope} requires organization of type ${expected}`);
    }
};

export const createApplicant = async (data: any) => {
    try {
        await validateApplicantOrganization(data.scope, data.organization);
        const applicant = await Applicant.create(data);
        return { success: true, status: 201, data: applicant };
    } catch (err: any) {
        return { success: false, status: 400, message: err.message };
    }
};

// Get Applicants
export const getApplicants = async (scope: string) => {    
    const applicants = await Applicant.find({scope}).populate('organization').sort({ createdAt: -1 }).lean();
    return { success: true, status: 200, data: applicants };
};

export const updateApplicant = async (id: string, data: any) => {
    try {
        await validateApplicantOrganization(data.scope, data.organization);
        const applicant = await Applicant.findById(id);
        if (!applicant) {
            return { success: false, status: 404, message: 'Applicant not found' };
        }
        Object.assign(applicant, data);
        await applicant.save();
        return { success: true, status: 200, data: applicant };
    } catch (err: any) {
        return { success: false, status: 400, message: err.message };
    }
};


export const deleteApplicant = async (id: string) => {
    const applicant = await Applicant.findById(id);
    if (!applicant) {
        return { success: false, status: 404, message: 'Applicant not found' };
    }
    await applicant.deleteOne();
    return { success: true, status: 200, message: 'Applicant deleted successfully' };
};