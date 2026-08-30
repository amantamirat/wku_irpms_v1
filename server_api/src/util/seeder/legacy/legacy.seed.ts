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
import { ExtractedMember, LegacyProjectDTO } from "./legacy.dto";

export class LegacySeeder {

    private readonly LEGACY_GRANT = "Legacy Grant";
    private readonly LEGACY_THEMATICS = "Legacy Thematics";
    private readonly RESEARCH_DIRECTORATE = "Research"

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
        console.log("🚀 Starting legacy migration...");

        const projects = await this.loadProjects();
        await this.seedColleges(projects);
        await this.seedDepartments(projects);

        await this.seedLegacyCalendars(projects);
        await this.seedLegacyThemes(projects);

        await this.seedUsers();

        await this.seedDirectorates();

        const grant = await this.seedLegacyGrant(projects);
        await this.seedProjects(String(grant._id), projects);
    }

    private async loadProjects(): Promise<LegacyProjectDTO[]> {
        const filePath = path.join(
            process.cwd(),
            "data/legacy/info.json"
        );
        const rawData = await fs.readFile(filePath, "utf-8");
        return JSON.parse(rawData);
    }

    private parseName(raw: string) {
        const clean =
            raw
                .replace(/\t/g, " ")
                .replace(/\s+/g, " ")
                .trim();
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

    private parseTeamMembers(
        detail: string
    ): ExtractedMember[] {

        return detail
            .split(";")
            .map(member => {

                const match = member.match(
                    /(.*?)\s*\[(.*?)\s*\/\s*(.*?)\]/
                );

                if (!match) return null;

                const parsedName =
                    this.parseName(match[1].trim());

                return {
                    name: parsedName.name,
                    department: match[2].trim(),
                    college: match[3].trim()
                };
            })
            .filter(Boolean) as ExtractedMember[];
    }

    private async buildCollaborators(
        item: LegacyProjectDTO
    ) {
        const members = this.parseTeamMembers(
            item.Team_Members_Detail
        );

        const parsedPIName = this.parseName(item.PI_Name).name;

        const collaborators: CollaboratorDto[] = [];

        for (const member of members) {

            const affliation = await this.organizationRepo.findOne(
                { name: member.department }
            );

            if (!affliation) {
                throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND,
                    `Department not found ${member.department}`
                );
            }

            const parsedMemberName = this.parseName(member.name).name;

            const user =
                await this.userService.findOne({
                    workspace: String(affliation._id),
                    name: parsedMemberName
                });

            if (!user) {
                throw new AppError(ERROR_CODES.USER_NOT_FOUND,
                    `User not found ${member.name} department ${member.department}`
                );
            }


            collaborators.push({
                member: String(user._id),
                role:
                    parsedMemberName === parsedPIName
                        ? "Principal Investigator"
                        : "Co-Investigator",
                isLeadPI:
                    parsedMemberName === parsedPIName
            });
        }

        return collaborators;
    }

    private buildPhases(
        budget: number
    ): PhaseDto[] {

        const half = budget / 2;

        return [
            {
                order: 1,
                title: "Research Phase I",
                budget: half,
                duration: 60,
                description: "Initial project implementation"
            },
            {
                order: 2,
                title: "Research Phase II",
                budget: half,
                duration: 60,
                description: "Final implementation and reporting"
            }
        ];
    }


    private async mapToCreateProjectDTO(
        item: LegacyProjectDTO,
        grantId: string,
        thematicId: string
    ): Promise<CreateProjectDTO> {

        const year = Number(
            item.Academic_Year?.substring(0, 4)
        );

        if (!year) {
            throw new AppError(
                ERROR_CODES.CALENDAR_NOT_FOUND,
                `Invalid academic year ${item.Academic_Year}`
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
                `PI not found ${item.PI_Name}`
            );
        }

        if (!item.SubTheme) {
            throw new AppError(
                ERROR_CODES.THEME_NOT_FOUND,
                `SubTheme missing for project ${item.Project_Title}`
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
            title: item.Project_Title,
            summary: `Imported project ${item.Academic_Year}`,
            leadPI: pi.member,
            themes: [
                String(theme._id)
            ],
            collaborators,
            phases: this.buildPhases(
                item.Approved_Budget
            )
        };
    }


    async seedProjects(
        grantId: string,
        projects: LegacyProjectDTO[]
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

                await this.projectService.create(
                    dto,
                    { skipValidation: true }
                );

                created++;

            } catch (error) {

                if (error instanceof AppError) {
                    failed++;

                    console.error(
                        `❌ Seed failed [${error.code}]: ` +
                        `${error.message}: ${item.Project_Title}`
                    );

                    continue;
                }

                if ((error as any)?.code === 11000) {
                    skipped++;

                    console.log(
                        `⏭️ Duplicate skipped: ${item.Project_Title}`
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


    async seedColleges(projects: LegacyProjectDTO[]) {
        const colleges = new Set<string>();

        for (const item of projects) {
            if (item.PI_College) {
                colleges.add(item.PI_College.trim());
            }

            const members = this.parseTeamMembers(
                item.Team_Members_Detail
            );

            for (const member of members) {
                colleges.add(member.college.trim());
            }
        }

        let seeded = false;

        for (const collegeName of colleges) {
            const exists = await this.organizationRepo.findOne({
                name: collegeName,
                type: Unit.college
            });

            if (exists) {
                continue;
            }

            await this.organizationRepo.create({
                type: Unit.college,
                name: collegeName
            });

            seeded = true;
        }

        if (seeded) {
            console.log("✅ Colleges seeded");
        }
    }

    async seedDepartments(projects: LegacyProjectDTO[]) {

        const departments = new Map<string, string>();

        for (const item of projects) {
            // PI department
            if (item.PI_Department &&
                item.PI_College
            ) {
                departments.set(
                    `${item.PI_Department}-${item.PI_College}`, item.PI_Department
                );
            }
            // Team member departments
            const members = this.parseTeamMembers(item.Team_Members_Detail);
            for (const member of members) {
                departments.set(`${member.department}-${member.college}`, member.department);

            }

        }
        let seeded = false;
        for (const key of departments.keys()) {
            const [
                departmentName,
                collegeName
            ] = key.split("-");
            const college =
                await this.organizationRepo.findOne(
                    { name: collegeName }
                );
            if (!college) {
                console.warn(`Missing college ${collegeName}`);
                continue;
            }
            const exists = await this.organizationRepo.exists({ name: departmentName });

            if (exists)
                continue;

            await this.organizationRepo.create({
                type: Unit.department, name: departmentName,
                parent: String(college._id)
            });
            seeded = true;
        }

        if (seeded)
            console.log("✅ Departments seeded");
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

    async seedUsers() {
        const filePath = path.join(process.cwd(), 'data/legacy', 'researchers.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const users = JSON.parse(rawData);
        let seeded = false;
        for (const item of users) {
            const departmentName = item.Department;

            const department = await this.organizationRepo.findOne({ name: departmentName });
            if (!department) {
                console.warn(`Department ${departmentName} does not exist`);
                continue;
            }
            const parsed = this.parseName(item.Name);

            const userExists =
                await this.userService.findOne({
                    workspace: String(department._id),
                    name: parsed.name
                });
            if (userExists)
                continue;

            //use service
            await this.userService.create({
                name: parsed.name,
                workspace: String(department._id),
                gender: item.Gender
            });

            seeded = true;
        }
        if (seeded) console.log("✅ Users seeded");
    }

    async seedLegacyThemes(projects: LegacyProjectDTO[]) {
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

    async seedLegacyCalendars(projects: LegacyProjectDTO[]) {
        const years = new Set<number>();

        for (const project of projects) {
            const academicYear =
                project.Academic_Year?.trim();

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

    async seedLegacyGrant(projects: LegacyProjectDTO[]) {
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
                    total + (project.Approved_Budget || 0),
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


export function createLegacySeeder() {
    return new LegacySeeder(
        organizationRepo,
        grantRepo,
        thematicRepo,
        themeRepo,
        calendarRepo,
        userService,
        projectService
    );
}