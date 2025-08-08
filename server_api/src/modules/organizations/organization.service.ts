import Organization from './organization.model';
import { Unit } from './enums/unit.enum';
import { validateOrganization } from './organization.validator';

const parentTypeRules: Partial<Record<Unit, Unit>> = {
  [Unit.Department]: Unit.College,
  [Unit.Program]: Unit.Department,
  [Unit.Center]: Unit.Directorate,
  [Unit.External]: Unit.Sector,
  [Unit.Rank]: Unit.Position
};

/**
 * Validate parent organization type and existence
 */
const validateParentOrganization = async (childType: Unit, parentId?: string) => {
  const expectedParentType = parentTypeRules[childType];
  if (!expectedParentType) return { success: true };
  if (!parentId) {
    return {
      success: false, message: `${childType} requires a parent of type ${expectedParentType}`,
    };
  }
  const parentOrg = await Organization.findById(parentId);
  if (!parentOrg) {
    return { success: false, message: `Parent (${expectedParentType}) organization not found` };
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

export const getOrganizationsByType = async (type: string) => {
  const organizations = await Organization.find({ type }).sort({ createdAt: -1 }).lean();
  return { success: true, status: 200, data: organizations };
};

export const getOrganizationsByParent = async (parent: string) => {
  const organizations = await Organization.find({ parent }).sort({ createdAt: -1 }).lean();
  return { success: true, status: 200, data: organizations };
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

export const deleteOrganization = async (id: string) => {
  const org = await Organization.findById(id);
  if (!org) {
    return { success: false, status: 404, message: 'Organization not found' };
  }
  await org.deleteOne();
  return { success: true, status: 200, message: 'Organization deleted successfully' };
};