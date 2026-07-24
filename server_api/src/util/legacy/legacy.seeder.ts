import fs from 'fs/promises';
import path from 'path';
import { IGrantRepository } from "../../modules/grants/grant.repository";
import { IOrganizationRepository } from "../../modules/organization/organization.repository";
import { CollaboratorDto } from "../../modules/projects/collaborators/collaborator.dto";
import { PhaseDto } from "../../modules/projects/phase/phase.dto";
import { CreateProjectDTO } from "../../modules/projects/project.dto";
import { IThemeRepository } from "../../modules/thematics/themes/theme.repository";
import { IUserRepository } from "../../modules/users/user.repository";
import { ExtractedMember, LegacyProjectDTO } from "./legacy.dto";
import { AppError } from '../../common/errors/app.error';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { Unit } from '../../common/constants/enums';
import { ICalendarRepository } from '../../modules/calendar/calendar.repository';
import { IProjectRepository } from '../../modules/projects/project.repository';
import { ProjectService } from '../../modules/projects/project.service';

export class LegacySeeder {

    constructor(
        private readonly userRepo: IUserRepository,
        private readonly organRepo: IOrganizationRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly themeRepo: IThemeRepository,
        private readonly calendarRepo: ICalendarRepository,
        private readonly projectService: ProjectService
    ) {

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

            const affliation = await this.organRepo.findByName(
                member.department
            );

            if (!affliation) {
                throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND,
                    `Department not found ${member.department}`
                );
            }

            const parsedMemberName = this.parseName(member.name).name;

            const user =
                await this.userRepo.findOne({
                    workspace: String(affliation._id),
                    name: parsedMemberName
                });

            if (!user) {
                throw new AppError(ERROR_CODES.USER_NOT_FOUND,
                    `User not found ${member.name} department ${member.department}`
                );
            }


            collaborators.push({
                applicant: String(user._id),
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
        thematicId: string
    ): Promise<CreateProjectDTO> {

        const year =
            Number(item.Academic_Year
                ?.substring(0, 4));

        if (!year) {
            throw new AppError(
                ERROR_CODES.CALENDAR_NOT_FOUND,
                `Invalid academic year ${item.Academic_Year}`
            );
        }
        const calendar =
            await this.calendarRepo.findOne({
                year
            });

        if (!calendar) {
            throw new AppError(
                ERROR_CODES.CALENDAR_NOT_FOUND,
                `Calendar not found ${year}`
            );
        }

        const collaborators = await this.buildCollaborators(item);
        const pi = collaborators.find(x => x.isLeadPI);
        if (!pi) {
            throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND, `PI not found ${item.PI_Name}`);
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
            throw new AppError(ERROR_CODES.THEME_NOT_FOUND, `Theme not found ${item.SubTheme.trim()}`);
        }

        return {
            grant: "",
            calendar: String(calendar._id),
            title: item.Project_Title,
            summary: `Imported project ${item.Academic_Year}`,
            applicant: pi.applicant,
            themes: [
                String(theme._id)
            ],
            collaborators,
            phases:
                this.buildPhases(
                    item.Approved_Budget
                )
        };
    }


    async seedProjects(grantTitle: string) {
        const grantDoc = await this.grantRepo.findOne(grantTitle);
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }
        const filePath = path.join(process.cwd(), 'data/legacy', 'info.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const projects = JSON.parse(rawData);
        let seeded = false;

        for (const item of projects) {
            try {
                const dto = await this.mapToCreateProjectDTO(
                    item,
                    String(grantDoc.thematic)
                );
                if (dto) {
                    await this.projectService
                        .create({ ...dto, grant: String(grantDoc._id) }, { skipValidation: true }
                        );
                    seeded = true;
                }
            } catch (error) {

                if (error instanceof AppError) {
                    console.error(`❌ Seed failed [${error.code}]: ${error.message} :${item.Project_Title}`);
                }
                else if ((error as any).code === 11000) {
                    console.log(
                        `⏭️ Duplicate skipped: ${item.Project_Title}`
                    );
                    continue;
                }

                else {

                    console.error("❌ Unexpected seed error:", error);
                    throw error;
                }
            }
        }

        if (seeded) console.log('✅ Project seeded from Legacy');

    }


    async seedColleges() {

        const filePath = path.join(process.cwd(), 'data/legacy', 'info.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const projects = JSON.parse(rawData);

        const colleges = new Set<string>();

        for (const item of projects) {
            // PI college
            if (item.PI_College) {
                colleges.add(item.PI_College.trim());
            }
            // Team member colleges
            const members = this.parseTeamMembers(item.Team_Members_Detail);
            for (const member of members) {
                colleges.add(
                    member.college.trim()
                );
            }
        }
        let seeded = false;
        for (const collegeName of colleges) {
            const exists =
                await this.organRepo.findByName(
                    collegeName
                );
            if (exists)
                continue;
            await this.organRepo.create({
                type: Unit.college,
                name: collegeName
            });
            seeded = true;
        }

        if (seeded) console.log("✅ Colleges seeded");
    }

    async seedDepartments() {

        const filePath = path.join(process.cwd(), 'data/legacy', 'info.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const projects = JSON.parse(rawData);

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
                await this.organRepo.findByName(
                    collegeName
                );
            if (!college) {
                console.warn(`Missing college ${collegeName}`);
                continue;
            }
            const exists = await this.organRepo.findByName(departmentName);

            if (exists)
                continue;

            await this.organRepo.create({
                type: Unit.department, name: departmentName,
                parent: String(college._id)
            });
            seeded = true;
        }

        if (seeded)
            console.log("✅ Departments seeded");
    }

    async seedUsers() {
        const filePath = path.join(process.cwd(), 'data/legacy', 'researchers.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const users = JSON.parse(rawData);
        let seeded = false;
        for (const item of users) {
            const departmentName = item.Department;

            const department = await this.organRepo.findByName(departmentName);
            if (!department) {
                console.warn(`Department ${departmentName} does not exist`);
                continue;
            }
            const parsed = this.parseName(item.Name);

            const userExists =
                await this.userRepo.findOne({
                    workspace: String(department._id),
                    name: parsed.name
                });
            if (userExists)
                continue;

            //use service
            await this.userRepo.create({
                name: parsed.name,
                workspace: String(department._id),
                gender: item.Gender
            });

            seeded = true;
        }
        if (seeded) console.log("✅ Users seeded");
    }

}
