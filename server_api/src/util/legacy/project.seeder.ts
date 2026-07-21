import fs from 'fs/promises';
import path from 'path';
import { OrganizationRepository } from "../../modules/organization/organization.repository";
import { UserRepository } from "../../modules/users/user.repository";
import { ExtractedMember, LegacyProjectSeedDTO } from "./legacy.dto";
import { CollaboratorDto } from "../../modules/projects/collaborators/collaborator.dto";
import { PhaseDto } from "../../modules/projects/phase/phase.dto";
import { CreateGrantProjectDTO } from "../../modules/projects/project.dto";
import { GrantRepository } from "../../modules/grants/grant.repository";
import { ThemeRepository } from "../../modules/thematics/themes/theme.repository";
import { ProjectService } from '../../modules/projects/project.service';
import { NewProjectService } from '../../modules/projects/new.project.service';
import { ProjectRepository } from '../../modules/projects/project.repository';
import { CollaboratorService } from '../../modules/projects/collaborators/collaborator.service';

export class ProjectSeeder {

    //private projectService: NewProjectService;
    constructor(
        private userRepo = new UserRepository(),
        private organRepo = new OrganizationRepository(),
        private grantRepo = new GrantRepository(),
        private themeRepo = new ThemeRepository(),
        
    ) {
       
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

                return {
                    name: match[1].trim(),
                    department: match[2].trim(),
                    college: match[3].trim()
                };
            })
            .filter(Boolean) as ExtractedMember[];
    }

    private async buildCollaborators(
        item: LegacyProjectSeedDTO
    ) {

        const members = this.parseTeamMembers(
            item.Team_Members_Detail
        );


        const collaborators: CollaboratorDto[] = [];


        for (const member of members) {

            const affliation = await this.organRepo.findByName(
                member.department
            );

            if (!affliation) {
                console.warn(
                    `Department not found ${member.department}`
                );
                continue;
            }

            const user =
                await this.userRepo.findOne({
                    workspace: String(affliation._id),
                    name: member.name
                });


            if (!user) {
                console.warn(
                    `User not found ${member.name}`
                );
                continue;
            }


            collaborators.push({
                applicant: String(user._id),
                role:
                    member.name === item.PI_Name
                        ? "Principal Investigator"
                        : "Co-Investigator",

                isLeadPI:
                    member.name === item.PI_Name
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
        item: LegacyProjectSeedDTO,
        grantTitle: string
    ): Promise<CreateGrantProjectDTO | null> {

        const grantDoc = await this.grantRepo.findOne(grantTitle);

        const collaborators =
            await this.buildCollaborators(
                item
            );


        const pi =
            collaborators.find(
                x => x.isLeadPI
            );


        if (!pi) {
            throw new Error(
                `PI not found ${item.PI_Name}`
            );
        }

        const theme =
            await this.themeRepo.findOne({
                title: item.SubTheme.trim(),
                thematicArea: String(grantDoc?.thematic)
            });

        if (!theme) {
            return null;
        }

        return {

            grant: String(grantDoc?._id),

            title: item.Project_Title,

            summary:
                `Imported project ${item.Academic_Year}`,

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


    async seedProjects() {
        try {
            const filePath = path.join(process.cwd(), 'legacy', 'projects.json');
            const rawData = await fs.readFile(filePath, 'utf-8');
            const projects = JSON.parse(rawData);

            let seeded = false;

            for (const item of projects) {
                const dto =
                    await this.mapToCreateProjectDTO(
                        item,
                        ""
                    );


               /* await this.projectService
                    .createFromGrant(dto);*/


            }

            if (seeded) console.log('✅ System settings seeded from JSON');
        } catch (error) {
            console.error('❌ Error seeding settings:', error);
        }
    }

}
