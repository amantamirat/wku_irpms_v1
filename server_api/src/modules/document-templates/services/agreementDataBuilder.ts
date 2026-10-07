import { toWords } from "number-to-words";
import { formatDate } from "../../../common/utils/date.utils";
import { ICollaborator } from "../../projects/collaborators/collaborator.model";
import { IPhaseActivity } from "../../projects/phase/activities/phase-activity.model";
import { IPhase } from "../../projects/phase/phase.model";
import { IProject } from "../../projects/project.model";

/* -------------------------------------------------------------------------- */
/*  Template View Models                                                      */
/* -------------------------------------------------------------------------- */

export interface AgreementPerson {
    name: string;
}

export interface AgreementBudgetItem {
    no: number;
    description: string;
    unit: string;
    participants: number;
    days: number;
    unitCost: number;
    unitCostFormatted: string;
    total: number;
    totalFormatted: string;
}

export interface AgreementData {
    phaseNumber: number;
    membersLine: string;
    agreementDate: string;
    title: string;

    totalBudget: number;
    totalBudgetFormatted: string;
    totalBudgetWords: string;

    totalPhases: number;
    startDate: string;
    endDate: string;

    generalObjective: string;
    specificObjectives: string[];
    expectedOutputs: string;

    phaseBudget: number;
    phaseBudgetFormatted: string;
    phaseBudgetWords: string;

    phaseStart: string;
    phaseEnd: string;

    budgetItems: AgreementBudgetItem[];

    pi: AgreementPerson;
    members: AgreementPerson[];
    coordinator: AgreementPerson;
    director: AgreementPerson;
    vp: AgreementPerson;
}

/* -------------------------------------------------------------------------- */
/*  Builder Input                                                             */
/* -------------------------------------------------------------------------- */

export interface BuildAgreementDataInput {
    project: IProject;
    projectPhases: number;
    startDate: Date;
    endDate: Date;
    phase: IPhase;
    activities: IPhaseActivity[];
    grant: any;
    collaborators: ICollaborator[];

    options?: {
        agreementDate?: Date | string;
    };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const num = (value: unknown): number => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
};

const fmtDate = (value: unknown): string => {
    return value ? formatDate(value as any) : "";
};

const toList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) =>
                String(
                    item?.text ??
                    item?.title ??
                    item
                ).trim()
            )
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/\r?\n|;/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

/**
 * Converts a monetary amount to words.
 *
 * Example:
 *
 * 1234.50
 * -> One Thousand Two Hundred Thirty-Four Birr and 50/100 only
 */
export function moneyToWords(amount: number): string {
    const totalCents = Math.round(
        Math.max(0, num(amount)) * 100
    );

    const birr = Math.floor(totalCents / 100);
    const cents = totalCents % 100;

    const words = toWords(birr).replace(
        /\b[a-z]/g,
        (character) => character.toUpperCase()
    );

    const centsPart = cents
        ? ` and ${String(cents).padStart(2, "0")}/100`
        : "";

    return `${words} Birr${centsPart} only`;
}

function formatMoney(value: unknown): string {
    return num(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
/* -------------------------------------------------------------------------- */
/*  Agreement Data Builder                                                    */
/* -------------------------------------------------------------------------- */

export class AgreementDataBuilder {

    build({
        project,
        projectPhases,
        startDate,
        endDate,
        phase,
        activities,
        grant,
        collaborators,
        options = {},
    }: BuildAgreementDataInput): AgreementData {

        /* ------------------------------------------------------------------ */
        /*  Agreement date                                                    */
        /* ------------------------------------------------------------------ */

        const agreementDate = fmtDate(
            options.agreementDate ?? new Date()
        );

        /* ------------------------------------------------------------------ */
        /*  Collaborators / Researchers                                      */
        /* ------------------------------------------------------------------ */

        const members = collaborators ?? [];

        const piCollaborator =
            members.find((collaborator) => {
                const role = String(
                    collaborator?.role ?? ""
                ).toLowerCase();

                return (
                    collaborator?.isLeadPI === true ||
                    role === "lead-pi" ||
                    role === "pi"
                );
            }) ?? members[0];

        const otherMembers = members
            .filter(
                (collaborator) =>
                    collaborator !== piCollaborator
            )
            .map((collaborator) => ({
                name: this.getUserName(collaborator),
            }))
            .filter((person) => person.name);

        const membersLine = members
            .map((collaborator) =>
                this.getUserName(collaborator)
            )
            .filter(Boolean)
            .join(", ");

        /* ------------------------------------------------------------------ */
        /*  Phase budget items                                                */
        /* ------------------------------------------------------------------ */

        const budgetItems: AgreementBudgetItem[] = (
            activities ?? []
        ).map((item: IPhaseActivity, index: number) => {
            const participants = num(item?.detailCost?.participants);
            const days = num(item?.detailCost?.duration);
            const unitCost = num(item?.detailCost?.unitPrice);

            const total =
                num(item?.cost) ||
                participants * days * unitCost;

            return {
                no: index + 1,

                description:
                    item?.title ??
                    item?.description ??
                    "",

                unit:
                    item?.detailCost ? "days" :
                        "",

                participants,
                days,
                unitCost,

                unitCostFormatted:
                    formatMoney(unitCost),

                total,

                totalFormatted:
                    formatMoney(total),
            };
        });

        /* ------------------------------------------------------------------ */
        /*  Phase budget                                                      */
        /* ------------------------------------------------------------------ */

        const itemsSum = budgetItems.reduce(
            (sum, item) => sum + item.total,
            0
        );

        const phaseBudget =
            num(phase?.budget) ||
            itemsSum;

        /* ------------------------------------------------------------------ */
        /*  Total project budget                                              */
        /* ------------------------------------------------------------------ */

        const totalBudget =
            num(project?.totalBudget) ||
            phaseBudget;

        /* ------------------------------------------------------------------ */
        /*  Number of phases                                                  */
        /* ------------------------------------------------------------------ */

        const totalPhases =
            num(projectPhases) ||
            1;

        /* ------------------------------------------------------------------ */
        /*  Objectives                                                        */
        /* ------------------------------------------------------------------ */

        const specificObjectives = toList(
            project?.objectives?.specific
        );

        const expectedOutputs = toList(
            project?.objectives?.expectedOutputs
        ).join("; ");

        /* ------------------------------------------------------------------ */
        /*  Final template view model                                         */
        /* ------------------------------------------------------------------ */

        return {
            phaseNumber: num(phase?.order) || 1,

            membersLine,

            agreementDate,

            title: project?.title ?? "",

            totalBudget,

            totalBudgetFormatted:
                formatMoney(totalBudget),

            totalBudgetWords:
                moneyToWords(totalBudget),

            totalPhases,

            startDate:
                fmtDate(startDate),

            endDate:
                fmtDate(endDate),

            generalObjective:
                project?.objectives?.general ?? "",

            specificObjectives,

            expectedOutputs,

            phaseBudget,

            phaseBudgetFormatted:
                formatMoney(phaseBudget),

            phaseBudgetWords:
                moneyToWords(phaseBudget),

            phaseStart:
                fmtDate(phase?.startDate),

            phaseEnd:
                fmtDate(phase?.endDate),

            budgetItems,

            pi: {
                name: this.getUserName(piCollaborator),
            },

            members: otherMembers,

            coordinator: {
                name: this.getPersonName(grant?.coordinator),
            },

            director: {
                name: this.getPersonName(grant?.director),
            },

            vp: {
                name: this.getPersonName(grant?.vicePresident),
            },
        };
    }

    /* ---------------------------------------------------------------------- */
    /*  User name                                                             */
    /* ---------------------------------------------------------------------- */

    private getUserName(
        collaborator: any
    ): string {

        if (!collaborator) {
            return "";
        }

        return (
            collaborator.member.name ||
            collaborator?.member?.name ||
            this.getPersonName(
                collaborator?.member
            )
        );
    }

    /* ---------------------------------------------------------------------- */
    /*  Generic person name                                                   */
    /* ---------------------------------------------------------------------- */

    private getPersonName(
        person: any
    ): string {

        if (!person) {
            return "";
        }

        if (person?.fullName) {
            return person.fullName;
        }

        return [
            person?.firstName,
            person?.middleName,
            person?.lastName,
        ]
            .filter(Boolean)
            .join(" ");
    }
}