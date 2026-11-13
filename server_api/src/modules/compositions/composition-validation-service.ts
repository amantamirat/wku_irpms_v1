import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { checkRange } from "../../common/types/range";
import { toStringId } from "../../common/utils/mongoose.utils";
import { ValidationResult } from "../constraints/services/constraint-validator.service";
import { GrantRepository } from "../grants/grant.repository";
import { CollaboratorStatus, ICollaborator } from "../projects/collaborators/collaborator.model";
import { CollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { ProjectRepository } from "../projects/project.repository";
import { IUser } from "../users/user.model";
import { UserRepository } from "../users/user.repository";
import { AggregationMode, IComposition } from "./composition.model";
import { CompositionRepository } from "./composition.repository";
import { collaborationRole, HistoryContextInput, HistoryValidationInput, ProjectInput } from "./history/history-validation-service";
import { HistoryParticipation } from "./history/history.model";
import { RequirementRepository } from "./requirements/requirement.repository";
import { RequirementValidationService } from "./requirements/requirement.validation-service";

type LoadedParticipants =
    | { ok: true; users: Map<string, IUser>; histories: Map<string, HistoryValidationInput> }
    | { ok: false; errors: string[] };

export interface CompositionValidationInput {
    lead: string;
    members: string[];
}

export type MembershipCompositionItem = Pick<
    ICollaborator,
    "member" | "isLeadPI"
>;


export function toCompositionValidationInput(
    items: MembershipCompositionItem[],
): CompositionValidationInput {

    const leads = items.filter(i => i.isLeadPI);

    if (leads.length === 0)
        throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND, 'Project has no lead PI.');

    if (leads.length > 1)
        throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND, 'Project has more than one lead PI.');

    const lead = toStringId(leads[0].member);

    const members = [
        ...new Set(
            items
                .filter(i => !i.isLeadPI)
                .map(i => toStringId(i.member))
                .filter(id => id !== lead),
        ),
    ];

    return { lead, members };
}


export class CompositionValidationService {
    constructor(
        private readonly compositionRepo: CompositionRepository,
        private readonly requirmentValidator: RequirementValidationService,
        private readonly requirmentRepo: RequirementRepository,
        private readonly collaboratorRepo: CollaboratorRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly grantRepo: GrantRepository,
        private readonly userRepo: UserRepository,
    ) { }

    async getComposition(
        id: string
    ): Promise<IComposition> {
        const composition = await this.compositionRepo.findById(id);
        if (!composition) {
            throw new AppError(
                ERROR_CODES.COMPOSITION_NOT_FOUND
            );
        }
        return composition;
    }

    // ---------------------------------------------------------------
    // Full validation: lead + members
    // ---------------------------------------------------------------
    async validate(
        composition: IComposition,
        context: HistoryContextInput,
        dto: CompositionValidationInput,
        excludeProjectId?: string,
    ): Promise<ValidationResult> {
        // Lead and members are loaded independently (the lead is excluded from members),
        // so running both validations in parallel does not duplicate any work.
        const [leadResult, membersResult] = await Promise.all([
            this.validateLead(composition, context, dto.lead, excludeProjectId),
            this.validateMembers(composition, context, dto.members, dto.lead, excludeProjectId),
        ]);

        const errors = [...leadResult.errors, ...membersResult.errors];
        return { valid: errors.length === 0, errors };
    }

    // ---------------------------------------------------------------
    // Build composition input from a project's collaborators
    // ---------------------------------------------------------------
    async getCompositionInputByProjectId(
        projectId: string,
    ): Promise<{ ok: true; input: CompositionValidationInput } | { ok: false; errors: string[] }> {
        const collaborators = await this.collaboratorRepo.find({
            project: projectId,
            excludeStatus: [CollaboratorStatus.declined],
        });

        const leads = collaborators.filter(c => c.isLeadPI);

        if (leads.length === 0) {
            return { ok: false, errors: [`Project ${projectId} has no lead PI.`] };
        }
        if (leads.length > 1) {
            return { ok: false, errors: [`Project ${projectId} has more than one lead PI.`] };
        }

        const lead = toStringId(leads[0].member);

        const members = [
            ...new Set(
                collaborators
                    .filter(c => !c.isLeadPI)
                    .map(c => toStringId(c.member))
                    .filter(id => id !== lead),
            ),
        ];

        return { ok: true, input: { lead, members } };
    }

    // ---------------------------------------------------------------
    // Validate a project's current team against a composition
    // ---------------------------------------------------------------
    async validateByProjectId(
        composition: IComposition,
        context: HistoryContextInput,
        projectId: string,
    ): Promise<ValidationResult> {
        const mapped = await this.getCompositionInputByProjectId(projectId);
        if (!mapped.ok) {
            return { valid: false, errors: mapped.errors };
        }

        return this.validate(composition, context, mapped.input, projectId);
    }

    // ---------------------------------------------------------------
    // Lead validation
    // ---------------------------------------------------------------
    async validateLead(
        composition: IComposition,
        context: HistoryContextInput,
        leadId: string,
        excludeProjectId?: string,
    ): Promise<ValidationResult> {
        // Nothing to check if the composition has no lead rule
        if (!composition.leadRule) {
            return { valid: true, errors: [] };
        }

        const leadRequirement = await this.requirmentRepo.findById(composition.leadRule.toString());
        if (!leadRequirement) {
            return {
                valid: false,
                errors: [`${composition.name}: leadRule ${composition.leadRule} not found.`],
            };
        }

        const loaded = await this.loadParticipants([leadId], excludeProjectId);

        if (!loaded.ok) {
            return { valid: false, errors: loaded.errors };
        }

        const result = await this.requirmentValidator.validate(
            leadRequirement,
            loaded.users.get(leadId)!,
            context,
            loaded.histories.get(leadId)!,
        );

        const errors = result.valid
            ? []
            : result.errors.map(e => `Lead requirement (${leadRequirement.name}): ${e}`);

        return { valid: errors.length === 0, errors };
    }

    // ---------------------------------------------------------------
    // Member validation
    // ---------------------------------------------------------------
    /**
     * @param excludeUserId Optional. Pass the lead's id so the lead is not counted as a member.
     */
    async validateMembers(
        composition: IComposition,
        context: HistoryContextInput,
        memberIds: string[],
        excludeUserId?: string,
        excludeProjectId?: string,
    ): Promise<ValidationResult> {
        const rules = composition.memberRules ?? [];

        // Nothing to check if the composition has no member rules
        if (rules.length === 0) {
            return { valid: true, errors: [] };
        }

        // Dedupe, drop empty strings, and drop the excluded user (usually the lead)
        const members = [...new Set(memberIds.filter(m => m && m !== excludeUserId))];

        // Load users and histories once, since every rule reuses them
        const loaded = await this.loadParticipants(members, excludeProjectId);
        if (!loaded.ok) {
            return { valid: false, errors: loaded.errors };
        }

        const errors: string[] = [];

        for (const rule of rules) {
            const requirement = await this.requirmentRepo.findById(rule.requirement.toString());
            if (!requirement) {
                errors.push(`${composition.name}: member requirement ${rule.requirement} not found.`);
                continue;
            }

            // Count members who satisfy this requirement
            const results = await Promise.all(
                members.map(memberId =>
                    this.requirmentValidator.validate(
                        requirement,
                        loaded.users.get(memberId)!,
                        context,
                        loaded.histories.get(memberId)!,
                    ),
                ),
            );
            const qualifyingCount = results.filter(r => r.valid).length;

            const isRatio = rule.mode === AggregationMode.RATIO;

            // A ratio over zero members is undefined, so there is nothing to evaluate
            if (isRatio && members.length === 0) continue;

            const value = isRatio
                ? (members.length > 0 ? qualifyingCount / members.length : 0)
                : qualifyingCount;

            const check = checkRange(rule.threshold, value);

            if (check !== 'ok') {
                const fmt = (n: number) => (isRatio ? `${(n * 100).toFixed(1)}%` : `${n}`);

                const currentValue = fmt(value);
                const threshold = `${fmt(rule.threshold.min)} - ${fmt(rule.threshold.max)}`;
                const direction = check === 'below' ? 'too low' : 'too high';

                errors.push(
                    `Member requirement "${requirement.name}" is not satisfied (${direction}). ` +
                    `Current value: ${currentValue}. Required range: ${threshold}.`,
                );
            }
        }

        return { valid: errors.length === 0, errors };
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    private async loadParticipants(userIds: string[],
        excludeProjectId?: string
    ): Promise<LoadedParticipants> {
        const users = new Map<string, IUser>();
        const histories = new Map<string, HistoryValidationInput>();

        if (userIds.length === 0) {
            return { ok: true, users, histories };
        }

        const found = await Promise.all(userIds.map(id => this.userRepo.findById(id)));

        const missing: string[] = [];
        userIds.forEach((id, i) => {
            const user = found[i];
            if (user) users.set(id, user);
            else missing.push(id);
        });

        if (missing.length > 0) {
            return { ok: false, errors: missing.map(id => `User ${id} not found.`) };
        }

        const historyEntries = await Promise.all(
            userIds.map(async id => {
                const user = users.get(id)!; // safe: missing users already returned above
                return [id, await this.userProjectHistory(user, excludeProjectId)] as const;
            }),
        );

        historyEntries.forEach(([id, history]) => histories.set(id, history));

        return { ok: true, users, histories };
    }

    private toParticipationRole(c: ICollaborator): collaborationRole | null {
        if (c.isLeadPI) return HistoryParticipation.LEAD;
        // Co-participation isn't supported yet. If `role` can hold a co-PI value,
        // return null here so those collaborators are skipped:
        // if (c.role === 'co-pi') return null;
        return HistoryParticipation.MEMBER;
    }

    private async userProjectHistory(user: IUser,
        excludeProjectId?: string
    ): Promise<HistoryValidationInput> {

        const userId = user._id.toString();
        const userName = user.name;

        const collaborations = (await this.collaboratorRepo.find({
            member: userId,
            excludeStatus: [CollaboratorStatus.declined],
        })).filter(c => !excludeProjectId || c.project.toString() !== excludeProjectId);

        if (collaborations.length === 0) {
            return { userId: userId, userName, projects: [] };
        }

        // One query for all projects
        const projectIds = [...new Set(collaborations.map(c => c.project.toString()))];
        const projectList = await this.projectRepo.find({ ids: projectIds });
        const projectMap = new Map(projectList.map(p => [p._id.toString(), p]));

        // One query for all grants (many projects can share a grant)
        const grantIds = [...new Set(projectList.map(p => p.grant.toString()))];
        const grantList = await this.grantRepo.find({ ids: grantIds });
        const grantMap = new Map(grantList.map(g => [g._id.toString(), g]));

        const projects: ProjectInput[] = [];

        for (const collab of collaborations) {
            const role = this.toParticipationRole(collab);
            if (!role) continue; // unsupported participation type

            const project = projectMap.get(collab.project.toString());
            if (!project) continue; // dangling reference

            const grant = grantMap.get(project.grant.toString());
            if (!grant) continue;

            // ProjectInput.calendar is required, IProject.calendar is optional/nullable
            if (!project.calendar) continue;

            projects.push({
                _id: project._id,
                grant: {
                    source: grant.fundingSource,
                    organization: grant.organization,
                },
                calendar: project.calendar,
                call: project.call ?? undefined,
                role,
                status: project.status,
            });
        }

        return { userId, userName, projects };
    }
}