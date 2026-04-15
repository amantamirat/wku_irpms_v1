export enum TemplateStatus {
    draft = 'draft',
    published = 'published',
}

/* ---------------- FIELD ---------------- */
export type Field = {
    _id?: string;
    label: string;
    fieldType: "text" | "textarea" | "number" | "file";
    isRequired?: boolean;
    placeholder?: string;
    order: number;
};

/* ---------------- SECTION ---------------- */
export type Section = {
    _id?: string;
    title: string;
    description?: string;
    order: number;
    isRequired?: boolean;
    fields: Field[];
};

/* ---------------- TEMPLATE ---------------- */
export type Template = {
    _id?: string;
    name: string;
    description?: string;
    sections: Section[];
    status?: TemplateStatus;
    createdAt?: Date;
    updatedAt?: Date;
};


export interface GetTemplatesOptions {
    status?: TemplateStatus;
    name?: string;
}

export const validateTemplate = (
    template: Template
): { valid: boolean; message?: string } => {

    if (!template.name || template.name.trim().length === 0) {
        return { valid: false, message: "Template name is required." };
    }

    if (!template.sections || template.sections.length === 0) {
        return { valid: false, message: "At least one section is required." };
    }

    for (const section of template.sections) {
        if (!section.title || section.title.trim().length === 0) {
            return { valid: false, message: "Section title is required." };
        }

        if (!section.fields || section.fields.length === 0) {
            return { valid: false, message: `Section "${section.title}" must have at least one field.` };
        }

        for (const field of section.fields) {
            if (!field.label || field.label.trim().length === 0) {
                return { valid: false, message: "Field label is required." };
            }
        }
    }

    return { valid: true };
};


export function sanitizeTemplate(template: Partial<Template>): Partial<Template> {
    return {
        ...template
    };
}