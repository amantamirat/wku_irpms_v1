export enum DocumentTemplateType {
    AGREEMENT = "agreement",
    CERTIFICATE = "certificate",
}

export enum TemplateEngine {
    HANDLEBARS = "handlebars",
}

export enum DocumentTemplateStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived",
}

export type TemplateVariableType =
    | "text"
    | "currency"
    | "date"
    | "object"
    | "collection";

export interface ITemplateVariable {
    key: string;
    label: string;
    type: TemplateVariableType;
    sample?: any;
    required?: boolean;
}

export interface IDocumentTemplate {
    _id?: string;
    name: string;
    description?: string;
    version: number;
    type: DocumentTemplateType;
    engine: TemplateEngine;
    filePath?: string;
    file?: File;
    status?: DocumentTemplateStatus;
    variables: Record<string, ITemplateVariable>;
}

export const AGREEMENT_VARIABLES: Record<string, ITemplateVariable> = {
    title: {
        key: "title",
        label: "Project Title",
        type: "text",
        required: true,
    },

    phaseNumber: {
        key: "phaseNumber",
        label: "Phase Number",
        type: "text",
        required: true,
    },

    phaseBudget: {
        key: "phaseBudget",
        label: "Phase Budget",
        type: "currency",
        required: true,
    },

    phaseBudgetWords: {
        key: "phaseBudgetWords",
        label: "Phase Budget (Words)",
        type: "text",
    },

    members: {
        key: "members",
        label: "Research Members",
        type: "collection",
    },

    budgetItems: {
        key: "budgetItems",
        label: "Budget Items",
        type: "collection",
    },

    pi: {
        key: "pi",
        label: "Principal Investigator",
        type: "object",
    },

    coordinator: {
        key: "coordinator",
        label: "Grant Coordinator",
        type: "object",
    },

    director: {
        key: "director",
        label: "Director",
        type: "object",
    },

    vp: {
        key: "vp",
        label: "Vice President",
        type: "object",
    },
};

export const CERTIFICATE_VARIABLES: Record<string, ITemplateVariable> = {
    "recipient.name": { key: "recipient.name", label: "Recipient Name", type: "text", sample: "Dr. Aster Kebede" },
    "course.title": { key: "course.title", label: "Course / Training Title", type: "text", sample: "Advanced GIS & Remote Sensing" },
    "issue.date": { key: "issue.date", label: "Issue Date", type: "date", sample: "2026-06-15" },
    "certificate.id": { key: "certificate.id", label: "Certificate ID", type: "text", sample: "CERT-2026-9982" },
};

export const createEmptyDocumentTemplate = (type: DocumentTemplateType = DocumentTemplateType.AGREEMENT): IDocumentTemplate => {
    return {
        name: "",
        description: "",
        version: 1,
        type: type,
        engine: TemplateEngine.HANDLEBARS,
        status: DocumentTemplateStatus.DRAFT,
        variables: type === DocumentTemplateType.AGREEMENT ? AGREEMENT_VARIABLES : CERTIFICATE_VARIABLES,
    };
};