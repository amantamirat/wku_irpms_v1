import Organization from '../organizations/organization.model';
import Theme, { ITheme, ThemeType } from './theme.model';
import { validateTheme } from './theme.validator';
import { Unit } from '../organizations/enums/unit.enum';

export const validateThemeReferences = async (data: Partial<ITheme>) => {
    const { type, parent, directorate } = data;

    if (type === ThemeType.catalog) {
        if (!directorate) throw new Error(`'directorate' is required for theme type.`);
        const org = await Organization.findById(directorate);
        if (!org || org.type !== Unit.Directorate) {
            throw new Error(`Theme Catelog must have an organization of unit 'Directorate'.`);
        }
        if (parent) {
            throw new Error(`'theme' type must not have a parent.`);
        }
    }

    if (type === ThemeType.priorityArea || type === ThemeType.subArea) {
        if (!parent) throw new Error(`'${type}' requires a parent theme.`);

        const parentTheme = await Theme.findById(parent);
        if (!parentTheme) throw new Error(`Parent theme not found.`);

        const expectedParentType =
            type === ThemeType.priorityArea ? ThemeType.theme : ThemeType.priorityArea;

        if (parentTheme.type !== expectedParentType) {
            throw new Error(`'${type}' must have a parent of type '${expectedParentType}'.`);
        }

        if (directorate) {
            throw new Error(`'${type}' must not include a directorate.`);
        }
    }
};

// Create Theme
export const createTheme = async (data: Partial<ITheme>) => {
    try {
        const { error, value } = validateTheme(data);
        if (error) throw new Error(error.details.map(d => d.message).join(', '));
        await validateThemeReferences(value);
        const theme = await Theme.create(value);
        return { success: true, status: 201, data: theme };
    } catch (err: any) {
        console.log(err);
        return { success: false, status: 400, message: err.message };
    }
};

export const getThemesByParent = async (parentId: string) => {
    const themes = await Theme.find({ parent: parentId })
        .sort({ createdAt: -1 })
        .lean();
    return { success: true, status: 200, data: themes };
};

export const getThemesByDirectorate = async (directorateId: string) => {
    const themes = await Theme.find({ directorate: directorateId })
        .sort({ createdAt: -1 })
        .lean();
    return { success: true, status: 200, data: themes };
};

// Update Theme
export const updateTheme = async (id: string, data: Partial<ITheme>) => {
    try {
        const theme = await Theme.findById(id);
        if (!theme) {
            return { success: false, status: 404, message: 'Theme not found' };
        }
        // Merge with existing for validation
        const merged = { ...theme.toObject(), ...data };
        const { error, value } = validateTheme(merged);
        if (error) throw new Error(error.details.map(d => d.message).join(', '));
        await validateThemeReferences(value);
        Object.assign(theme, data);
        await theme.save();
        return { success: true, status: 200, data: theme };
    } catch (err: any) {
        return { success: false, status: 400, message: err.message };
    }
};

// Delete Theme
export const deleteTheme = async (id: string) => {
    const theme = await Theme.findById(id);
    if (!theme) {
        return { success: false, status: 404, message: 'Theme not found' };
    }
    await theme.deleteOne(); // Will trigger pre-hook validation
    return { success: true, status: 200, message: 'Theme deleted successfully' };
};
