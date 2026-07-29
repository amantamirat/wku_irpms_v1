export type TemplateSection = {
    name: string;
    aliases: string[];
    required: boolean;
    guidelines?: string; // Prompts/rules for AI check (e.g., "Must list primary methodology")
    minWords?: number;
    maxWords?: number;
    order?: number;
};

export type Template = {
    _id?: string;
    name: string;
    description?: string;
    minPages?: number;
    maxPages?: number;
    sections: TemplateSection[];
};

export const validateTemplate = (
    template: Template
): { valid: boolean; message?: string } => {
    if (!template.name || template.name.trim() === '') {
        return { valid: false, message: 'Template Name is required.' };
    }

    if (!template.sections || template.sections.length === 0) {
        return { valid: false, message: 'At least one section is required.' };
    }

    for (const section of template.sections) {
        if (!section.name || section.name.trim() === '') {
            return { valid: false, message: 'All section names are required.' };
        }

        if (
            section.minWords &&
            section.maxWords &&
            section.minWords > section.maxWords
        ) {
            return {
                valid: false,
                message: `Invalid word range for section "${section.name}".`
            };
        }
    }

    return { valid: true };
};

export function sanitizeTemplate(
    template: Partial<Template>
): Partial<Template> {

    return {
        ...template,

        sections: template.sections?.map(section => ({
            name: section.name,
            aliases: section.aliases ?? [],
            required: section.required ?? true,
            minWords: section.minWords,
            maxWords: section.maxWords,
            order: section.order,
            guidelines: section.guidelines
        })),
    };
}

export const createEmptyTemplate = (): Template => ({
    name: "",
    description: "",
    minPages: 3,
    maxPages: 5,
    sections: [
        {
            name: "Abstract / Executive Summary",
            aliases: ["Abstract", "Summary"],
            required: true,
            guidelines: "Must summarize project scope, objectives, and expected outcomes.",
            minWords: 150,
            maxWords: 500,
            order: 1
        }
    ]
});