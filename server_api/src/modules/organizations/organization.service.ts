import Organization, { OrganizationType } from './organization.model';
import { validateOrganization } from './organization.validator';

const parentTypeRules: Partial<Record<OrganizationType, OrganizationType>> = {
  [OrganizationType.Department]: OrganizationType.College,
  [OrganizationType.Program]: OrganizationType.Department,
  [OrganizationType.External]: OrganizationType.Sector,
  [OrganizationType.Rank]: OrganizationType.Position
};

/**
 * Validate parent organization type and existence
 */
const validateParentOrganization = async (childType: OrganizationType, parentId?: string) => {
  const expectedParentType = parentTypeRules[childType];
  if (!expectedParentType) return { success: true };
  if (!parentId) {
    return {
      success: false, message: `${childType} requires a parent of type ${expectedParentType}`,
    };
  }
  const parentOrg = await Organization.findById(parentId);
  if (!parentOrg) {
    return { success: false, message: 'Parent organization not found' };
  }
  if (parentOrg.type !== expectedParentType) {
    return {
      success: false,
      message: `${childType} must have a parent of type ${expectedParentType}, but got ${parentOrg.type}`,
    };
  }
  return { success: true };
};


export const createOrganization = async (data: any) => {
  const { error, value } = validateOrganization(data);
  if (error) {
    return { success: false, status: 400, message: error.details.map(d => d.message).toString() };
  }
  const validation = await validateParentOrganization(data.type, data.parent);
  if (!validation.success) {
    return { success: false, status: 400, message: validation.message };
  }
  const created = await Organization.create(data);
  return { success: true, status: 201, data: created };
};



export const updateOrganization = async (id: string, data: any) => {
  const { error, value } = validateOrganization(data);
  if (error) {
    return { success: false, status: 400, message: error.details.map(d => d.message).toString() };
  }
  const validation = await validateParentOrganization(data.type, data.parent);
  if (!validation.success) {
    return { success: false, status: 400, message: validation.message };
  }
  const org = await Organization.findById(id);
  if (!org) {
    return { success: false, status: 404, message: 'Organization not found' };
  }
  Object.assign(org, data);
  await org.save();
  return { success: true, status: 200, data: org };
};