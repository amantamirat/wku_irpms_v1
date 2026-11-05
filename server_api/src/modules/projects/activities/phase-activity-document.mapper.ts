import { PhaseActivityType } from "./phase-activity.model";
import { PhaseDocumentType } from "../phase/documents/phase.doc.model";

/**
 * For each activity kind, the document types that can prove it was done.
 * Semantics: the activity needs AT LEAST ONE document whose type is in the list.
 * An empty list means no document is required for that kind.
 */
export const ACTIVITY_REQUIRED_DOCUMENTS: Record<
    PhaseActivityType,
    PhaseDocumentType[]
> = {
    [PhaseActivityType.DATA_COLLECTION]: [PhaseDocumentType.dataset],
    [PhaseActivityType.TRAINING_WORKSHOP]: [PhaseDocumentType.attendance],
    [PhaseActivityType.MEETING]: [PhaseDocumentType.meetingMinutes],
    [PhaseActivityType.TRANSPORTATION]: [PhaseDocumentType.activityEvidence],
    [PhaseActivityType.ANALYSIS]: [PhaseDocumentType.technicalReport],
    [PhaseActivityType.FIELD_VISIT]: [
        PhaseDocumentType.photo,
        PhaseDocumentType.activityEvidence,
    ],
    [PhaseActivityType.DISSEMINATION]: [PhaseDocumentType.deliverable],
    [PhaseActivityType.DESIGN]: [PhaseDocumentType.deliverable],
    [PhaseActivityType.OTHER]: [],
};

export function getRequiredDocumentTypes(
    kind: PhaseActivityType
): PhaseDocumentType[] {
    return ACTIVITY_REQUIRED_DOCUMENTS[kind] ?? [];
}

/**
 * Returns the accepted types if the documents don't satisfy the activity kind,
 * or null if everything is fine.
 */
export function findMissingDocumentTypes(
    kind: PhaseActivityType,
    documents: { type?: PhaseDocumentType }[]
): PhaseDocumentType[] | null {
    const required = getRequiredDocumentTypes(kind);

    if (required.length === 0) return null;

    const satisfied = documents.some(
        (d) => d.type !== undefined && required.includes(d.type)
    );

    return satisfied ? null : required;
}

/** "meetingMinutes" -> "Meeting minutes", "DATA_COLLECTION" -> "Data collection" */
export function humanize(value: string): string {
    const spaced = value
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}