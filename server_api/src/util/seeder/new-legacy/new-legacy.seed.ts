import fs from 'fs/promises';
import path from 'path';
import { Unit } from '../../../common/constants/enums';
import { AppError } from '../../../common/errors/app.error';
import { ERROR_CODES } from '../../../common/errors/error.codes';
import { calendarRepo, grantRepo, organizationRepo, projectService, thematicRepo, themeRepo, userService } from '../../../core/container';
import { CalendarStatus } from '../../../modules/calendar/calendar.model';
import { ICalendarRepository } from '../../../modules/calendar/calendar.repository';
import { FundingSource, GrantStatus } from '../../../modules/grants/grant.model';
import { IGrantRepository } from "../../../modules/grants/grant.repository";
import { IOrganizationRepository } from "../../../modules/organization/organization.repository";
import { CollaboratorDto } from "../../../modules/projects/collaborators/collaborator.dto";
import { PhaseDto } from "../../../modules/projects/phase/phase.dto";
import { CreateProjectDTO } from "../../../modules/projects/project.dto";
import { ProjectService } from '../../../modules/projects/project.service';
import { ThematicLevel } from '../../../modules/thematics/thematic.enum';
import { IThematicRepository } from '../../../modules/thematics/thematic.repository';
import { ThematicStatus } from '../../../modules/thematics/thematic.state-machine';
import { IThemeRepository } from "../../../modules/thematics/themes/theme.repository";
import { UserService } from '../../../modules/users/user.service';
import { NewLegacyProjectDTO } from './new-legacy.dto';
import { CollaboratorStatus } from '../../../modules/projects/collaborators/collaborator.model';
import { IPhaseActivityDetailCost } from '../../../modules/projects/phase/activities/phase-activity.model';

export class NewLegacySeeder {

    private readonly LEGACY_GRANT = "NEW Legacy Grant";
    private readonly LEGACY_THEMATICS = "NEW Legacy Thematics";
    private readonly RESEARCH_DIRECTORATE = "Research";

    constructor(
        private readonly organizationRepo: IOrganizationRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly thematicRepo: IThematicRepository,
        private readonly themeRepo: IThemeRepository,
        private readonly calendarRepo: ICalendarRepository,
        private readonly userService: UserService,
        private readonly projectService: ProjectService
    ) { }

    async run() {
        console.log("🚀 Starting new legacy migration...");

        const projects = await this.loadProjects();
        await this.seedDirectorates();
        await this.seedLegacyCalendars(projects);
        await this.seedLegacyThemes(projects);



        const grant = await this.seedLegacyGrant(projects);
        await this.seedProjects(String(grant._id), projects);
    }

    private async loadProjects(): Promise<NewLegacyProjectDTO[]> {

        const filePath = path.join(
            process.cwd(),
            "data/legacy/NewIRIMS.json"
        );

        const rawData = await fs.readFile(filePath, "utf-8");

        const normalizedData = rawData
            .replace(/\bNaN\b/g, "null")
            .replace(/\bInfinity\b/g, "null")
            .replace(/\b-Infinity\b/g, "null");

        return JSON.parse(normalizedData);
    }

    private parseName(raw: string) {
        const clean =
            raw
                .replace(/\t/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .replace(/^dr\.\s*/i, "");
        // Extract position from parentheses
        const positionMatch =
            clean.match(/\((.*?)\)/);
        const position =
            positionMatch
                ? positionMatch[1].trim()
                : null;
        // Remove only the position part
        const name =
            clean
                .replace(/\(.*?\)/, "")
                .trim();
        return {
            name,
            position
        };
    }

    private async createTempUser(parsedName: string) {
        const temporaryDepartment =
            await this.organizationRepo.findOne({
                name: "Temporary Department",
                type: Unit.department,
            });

        if (!temporaryDepartment) {
            throw new AppError(
                ERROR_CODES.ORGANIZATION_NOT_FOUND,
                "Temporary Department not found"
            );
        }

        const user = await this.userService.create({
            name: parsedName,
            workspace: String(temporaryDepartment._id),
        });

        console.log(
            `  ✓ Temporary user created: ${parsedName}`
        );

        if (!user) {
            throw new AppError("ERROR ON CREATING TEMP USER");
        }

        return user;
    }


    private async buildCollaborators(
        item: NewLegacyProjectDTO
    ): Promise<CollaboratorDto[]> {

        const collaborators: CollaboratorDto[] = [];

        const principalResearcherName =
            this.parseName(item.PrincipalResearcher).name;

        const collaboratorData = [
            {
                name: item.Collaborator1,
                role: item.Collaborator1Contribution,
            },
            {
                name: item.Collaborator2,
                role: item.Collaborator2Contribution,
            },
            {
                name: item.Collaborator3,
                role: item.Collaborator3Contribution,
            },
            {
                name: item.Collaborator4,
                role: item.Collaborator4Contribution,
            },
            {
                name: item.Collaborator5,
                role: item.Collaborator5Contribution,
            },
            {
                name: item.Collaborator6,
                role: item.Collaborator6Contribution,
            },
            {
                name: item.Collaborator7,
                role: item.Collaborator7Contribution,
            },
            {
                name: item.Collaborator8,
                role: item.Collaborator8Contribution,
            },
        ];

        const addedUsers = new Set<string>();

        // Add listed collaborators
        for (const collaborator of collaboratorData) {

            if (!collaborator.name) {
                continue;
            }

            const parsedName =
                this.parseName(collaborator.name).name;

            let user = await this.userService.findOne({
                name: parsedName
            });

            // Create temporary user if not found
            if (!user) {
                user = await this.createTempUser(parsedName);
            }

            const userId = String(user._id);

            if (addedUsers.has(userId)) {
                continue;
            }

            addedUsers.add(userId);

            const isLeadPI =
                parsedName === principalResearcherName;

            collaborators.push({
                member: userId,
                role:
                    collaborator.role?.trim() ||
                    (
                        isLeadPI
                            ? "Principal Investigator"
                            : "Co-Investigator"
                    ),
                status: CollaboratorStatus.verified,
                isLeadPI
            });
        }

        // ---------------------------------------------------------
        // Make sure Principal Researcher is included as Lead PI
        // ---------------------------------------------------------

        const principalUser =
            await this.userService.findOne({
                name: principalResearcherName
            }) ??
            await this.createTempUser(principalResearcherName);

        const principalUserId =
            String(principalUser._id);

        if (!addedUsers.has(principalUserId)) {

            collaborators.push({
                member: principalUserId,
                role: "Principal Investigator",
                isLeadPI: true
            });

            addedUsers.add(principalUserId);
        }

        return collaborators;
    }



    private buildPhaseActivities(
        researchPlanDetails?: string | null
    ): {
        title: string;
        cost: number;
        detailCost: IPhaseActivityDetailCost;
    }[] {
        if (
            !researchPlanDetails ||
            typeof researchPlanDetails !== "string"
        ) {
            return [];
        }

        return researchPlanDetails
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {

                const parts = line.split("|").map(part => part.trim());

                const values: Record<string, string> = {};

                for (const part of parts) {
                    const [key, ...rest] = part.split("=");

                    if (!key || rest.length === 0) {
                        continue;
                    }

                    values[key.trim()] = rest.join("=").trim();
                }

                const title = values.Activity;

                const participants = Number(values.Participants);
                const duration = Number(values.RequiredDays);
                const cost = Number(values.Cost);

                if (
                    !title ||
                    !Number.isFinite(participants) ||
                    !Number.isFinite(duration) ||
                    !Number.isFinite(cost)
                ) {
                    return null;
                }

                const unitPrice =
                    participants > 0 && duration > 0
                        ? cost / (participants * duration)
                        : 0;

                return {
                    title,
                    cost,
                    detailCost: {
                        participants,
                        duration,
                        unitPrice,
                    },
                };
            })
            .filter(
                (
                    activity
                ): activity is {
                    title: string;
                    cost: number;
                    detailCost: IPhaseActivityDetailCost;
                } => activity !== null
            );
    }


    private buildPhases(
        item: NewLegacyProjectDTO
    ): PhaseDto[] {

        const phaseData = [
            {
                order: 1,
                budget: item.Phase1Cost,
                startDate: item.Phase1StartDate,
                endDate: item.Phase1EndDate,
                activities: item.Phase1Activities,
                researchPlanDetails: item.Phase1ResearchPlanDetails,
            },
            {
                order: 2,
                budget: item.Phase2Cost,
                startDate: item.Phase2StartDate,
                endDate: item.Phase2EndDate,
                activities: item.Phase2Activities,
                researchPlanDetails: item.Phase2ResearchPlanDetails,
            },
            {
                order: 3,
                budget: item.Phase3Cost,
                startDate: item.Phase3StartDate,
                endDate: item.Phase3EndDate,
                activities: item.Phase3Activities,
                researchPlanDetails: item.Phase3ResearchPlanDetails,
            },
            {
                order: 4,
                budget: item.Phase4Cost,
                startDate: item.Phase4StartDate,
                endDate: item.Phase4EndDate,
                activities: item.Phase4Activities,
                researchPlanDetails: item.Phase4ResearchPlanDetails,
            },
            {
                order: 5,
                budget: item.Phase5Cost,
                startDate: item.Phase5StartDate,
                endDate: item.Phase5EndDate,
                activities: item.Phase5Activities,
                researchPlanDetails: item.Phase5ResearchPlanDetails,
            },
        ];

        const numberOfPhases = Math.min(
            Math.max(item.NumberOfPhases || 0, 0),
            phaseData.length
        );

        return phaseData
            .slice(0, numberOfPhases)
            .map(phase => ({
                order: phase.order,
                title: `Phase ${phase.order}`,

                budget: phase.budget as number,

                duration:
                    Math.ceil(
                        (phase.endDate as number) -
                        (phase.startDate as number)
                    ) + 1,

                description:
                    phase.activities ||
                    `Research Phase ${phase.order} implementation`,

                activities: this.buildPhaseActivities(
                    phase.researchPlanDetails
                ),
            }));
    }


    private async mapToCreateProjectDTO(
        item: NewLegacyProjectDTO,
        grantId: string,
        thematicId: string
    ): Promise<CreateProjectDTO> {

        const year = Number(
            item.AcYear?.substring(0, 4)
        );

        if (!year) {
            throw new AppError(
                ERROR_CODES.CALENDAR_NOT_FOUND,
                `Invalid academic year ${item.AcYear}`
            );
        }

        const calendar = await this.calendarRepo.findOne({
            year
        });

        if (!calendar) {
            throw new AppError(
                ERROR_CODES.CALENDAR_NOT_FOUND,
                `Calendar not found ${year}`
            );
        }

        const collaborators = await this.buildCollaborators(item);

        const pi = collaborators.find(
            collaborator => collaborator.isLeadPI
        );

        if (!pi) {
            throw new AppError(
                ERROR_CODES.LEAD_PI_NOT_FOUND,
                `PI not found ${item.PrincipalResearcher}`
            );
        }

        if (!item.SubTheme) {
            throw new AppError(
                ERROR_CODES.THEME_NOT_FOUND,
                `SubTheme missing for project ${item.ConceptNoteTitle}`
            );
        }

        const theme = await this.themeRepo.findOne({
            title: item.SubTheme.trim(),
            thematicArea: thematicId
        });

        if (!theme) {
            throw new AppError(
                ERROR_CODES.THEME_NOT_FOUND,
                `Theme not found ${item.SubTheme.trim()}`
            );
        }

        return {
            grant: grantId,
            calendar: String(calendar._id),
            title: item.ConceptNoteTitle,
            leadPI: pi.member,
            themes: [
                String(theme._id)
            ],
            collaborators,
            phases: this.buildPhases(item)
        };
    }


    async seedProjects(
        grantId: string,
        projects: NewLegacyProjectDTO[]
    ) {
        const grantDoc = await this.grantRepo.findById(grantId);

        if (!grantDoc) {
            throw new AppError(
                ERROR_CODES.GRANT_NOT_FOUND
            );
        }

        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const item of projects) {
            try {
                const dto = await this.mapToCreateProjectDTO(
                    item,
                    String(grantDoc._id),
                    String(grantDoc.thematic)
                );

                console.log(
                    "\n+++++++++++++++++++++++++++++++++++++++++++"
                );

                console.dir(dto, {
                    depth: null,
                    colors: true,
                });

                console.log(
                    "+++++++++++++++++++++++++++++++++++++++++++\n"
                );

                /*

                await this.projectService.create(
                    dto, dto.leadPI, { skipValidation: true }
                );
                */

                created++;

            } catch (error) {

                if (error instanceof AppError) {
                    failed++;

                    console.error(
                        `❌ Seed failed [${error.code}]: ` +
                        `${error.message}: ${item.ConceptNoteTitle}`
                    );

                    continue;
                }

                if ((error as any)?.code === 11000) {
                    skipped++;

                    console.log(
                        `⏭️ Duplicate skipped: ${item.ConceptNoteTitle}`
                    );

                    continue;
                }

                console.error(
                    "❌ Unexpected seed error:",
                    error
                );

                throw error;
            }
        }

        console.log(`
========================================
       Legacy Project Migration
========================================
Total projects : ${projects.length}
Created        : ${created}
Skipped        : ${skipped}
Failed         : ${failed}
========================================
`);
    }



    async seedDirectorates() {
        const directorates = [
            this.RESEARCH_DIRECTORATE,
            "Community Service",
            "Technology Transfer",
            "Indigenous Knowledge"
        ];

        let seeded = false;

        for (const name of directorates) {
            const exists = await this.organizationRepo.exists({
                name,
                type: Unit.directorate
            });

            if (exists)
                continue;

            await this.organizationRepo.create({
                type: Unit.directorate,
                name
            });

            seeded = true;
        }

        if (seeded) {
            console.log("✅ Directorates seeded");
        }
    }


    async seedLegacyThemes(projects: NewLegacyProjectDTO[]) {
        // 1. Find or create the legacy thematic area
        const thematic =
            await this.thematicRepo.findOne({
                title: this.LEGACY_THEMATICS
            });

        const thematicDoc =
            thematic ??
            await this.thematicRepo.create({
                title: this.LEGACY_THEMATICS,
                level: ThematicLevel.divison,
                status: ThematicStatus.published
            });

        // 2. Extract unique Theme -> SubTheme hierarchy
        const themes = new Map<string, Set<string>>();

        for (const item of projects) {
            const theme = item.Theme?.trim();
            const subTheme = item.SubTheme?.trim();

            if (!theme || !subTheme)
                continue;

            if (!themes.has(theme)) {
                themes.set(theme, new Set<string>());
            }

            themes.get(theme)!.add(subTheme);
        }

        // 3. Create parent themes and child themes
        for (const [themeTitle, subThemes] of themes) {

            // Find or create parent theme
            let parentTheme =
                await this.themeRepo.findOne({
                    title: themeTitle,
                    thematicArea: String(thematicDoc._id),
                    level: 0
                });

            if (!parentTheme) {
                parentTheme =
                    await this.themeRepo.create({
                        thematicArea: String(thematicDoc._id),
                        title: themeTitle,
                        level: 0
                    });
            }

            // 4. Create SubThemes
            for (const subThemeTitle of subThemes) {

                const exists =
                    await this.themeRepo.findOne({
                        title: subThemeTitle,
                        thematicArea: String(thematicDoc._id),
                        //parent: String(parentTheme._id),
                        //level: 1
                    });

                if (exists)
                    continue;

                await this.themeRepo.create({
                    thematicArea: String(thematicDoc._id),
                    parent: String(parentTheme._id),
                    title: subThemeTitle,
                    level: 1
                });
            }
        }

        console.log("✅ Legacy themes seeded");
    }

    async seedLegacyCalendars(projects: NewLegacyProjectDTO[]) {
        const years = new Set<number>();

        for (const project of projects) {
            const academicYear =
                project.AcYear?.trim();

            if (!academicYear)
                continue;

            const year = Number(
                academicYear.substring(0, 4)
            );

            if (!year) {
                console.warn(
                    `Invalid academic year: ${academicYear}`
                );
                continue;
            }

            years.add(year);
        }

        for (const year of years) {

            const exists =
                await this.calendarRepo.findOne({
                    year
                });

            if (exists)
                continue;

            await this.calendarRepo.create({
                year,
                startDate: new Date(`${year}-09-01`),
                endDate: new Date(`${year + 1}-08-31`),
                status: CalendarStatus.active
            });
        }
        console.log("✅ Legacy calendars seeded");
    }

    async seedLegacyGrant(projects: NewLegacyProjectDTO[]) {
        // Find Legacy Thematics
        const thematic = await this.thematicRepo.findOne({
            title: this.LEGACY_THEMATICS
        });

        if (!thematic) {
            throw new AppError(
                ERROR_CODES.THEMATIC_NOT_FOUND,
                "Legacy Thematics not found"
            );
        }

        // Find Research Directorate
        const researchDirectorate =
            await this.organizationRepo.findOne({
                name: this.RESEARCH_DIRECTORATE,
                type: Unit.directorate
            });

        if (!researchDirectorate) {
            throw new AppError(
                ERROR_CODES.ORGANIZATION_NOT_FOUND,
                "Research Directorate not found"
            );
        }

        // Calculate total approved budget
        const totalApprovedBudget =
            projects.reduce(
                (total, project) =>
                    total + (project.ApprovedBudget || 0),
                0
            );

        // Don't create duplicate grant
        const existing =
            await this.grantRepo.findOne(this.LEGACY_GRANT);

        if (existing) {
            return existing;
        }

        return this.grantRepo.create({
            title: this.LEGACY_GRANT,
            fundingSource: FundingSource.INTERNAL,
            organization: String(researchDirectorate._id),
            thematic: String(thematic._id),
            amount: totalApprovedBudget,
            //usedBudget: 0,
            status: GrantStatus.active,
            description: "Grant created during legacy data migration"
        });
    }

}


export function createNewLegacySeeder() {
    return new NewLegacySeeder(
        organizationRepo,
        grantRepo,
        thematicRepo,
        themeRepo,
        calendarRepo,
        userService,
        projectService
    );
}