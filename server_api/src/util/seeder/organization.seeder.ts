import fs from "fs/promises";
import path from "path";
import { IOrganizationRepository } from "../../modules/organization/organization.repository";
import { Unit } from "../../common/constants/enums";
import { organizationRepo } from "../../core/container";



export class LegacyOrganizationSeeder {

    constructor(
        private readonly organizationRepo: IOrganizationRepository
    ) { }


    async run() {

        console.log("🚀 Starting legacy organization seeding...");

        const filePath = path.join(
            process.cwd(),
            "data/legacy",
            "titles.json"
        );

        const rawData =
            await fs.readFile(filePath, "utf-8");

        const projects = JSON.parse(rawData);

        await this.seedColleges(projects);
        await this.seedDepartments(projects);

        await this.seedTemporaryOrganization()

        console.log("✅ Legacy organization seeding completed.");
    }


    private async seedColleges(projects: any[]) {

        const colleges = new Set<string>();

        for (const item of projects) {

            const collegeName =
                item.College?.trim();

            if (
                !collegeName ||
                collegeName.toLowerCase() === "not available"
            ) {
                continue;
            }

            colleges.add(collegeName);
        }

        let created = 0;
        let skipped = 0;

        for (const collegeName of colleges) {

            const exists =
                await this.organizationRepo.findOne({
                    name: collegeName,
                    type: Unit.college,
                });

            if (exists) {
                skipped++;
                continue;
            }

            await this.organizationRepo.create({
                type: Unit.college,
                name: collegeName,
            });

            created++;

            console.log(
                `  ✓ College created: ${collegeName}`
            );
        }

        console.log(
            `   Colleges: ${created} created, ${skipped} already existed`
        );
    }


    private async seedDepartments(projects: any[]) {

        const departments =
            new Map<string, {
                name: string;
                college: string;
            }>();

        for (const item of projects) {

            const departmentName =
                item.Dept?.trim();

            const collegeName =
                item.College?.trim();

            if (
                !departmentName ||
                !collegeName ||
                departmentName.toLowerCase() === "not available" ||
                collegeName.toLowerCase() === "not available"
            ) {
                continue;
            }

            const key =
                `${departmentName}|||${collegeName}`;

            departments.set(key, {
                name: departmentName,
                college: collegeName,
            });
        }

        let created = 0;
        let skipped = 0;

        for (const department of departments.values()) {

            const college =
                await this.organizationRepo.findOne({
                    name: department.college,
                    type: Unit.college,
                });

            if (!college) {
                console.warn(
                    `⚠️ College not found: ${department.college}. ` +
                    `Skipping department: ${department.name}`
                );
                continue;
            }

            const exists =
                await this.organizationRepo.findOne({
                    name: department.name,
                    type: Unit.department,
                    parent: String(college._id),
                });

            if (exists) {
                skipped++;
                continue;
            }

            await this.organizationRepo.create({
                type: Unit.department,
                name: department.name,
                parent: String(college._id),
            });

            created++;

            console.log(
                `  ✓ Department created: ` +
                `${department.name} → ${department.college}`
            );
        }

        console.log(
            `   Departments: ${created} created, ${skipped} already existed`
        );
    }

    private async seedTemporaryOrganization() {

        const collegeName = "Temporary College";
        const departmentName = "Temporary Department";

        // Seed temporary college
        let college = await this.organizationRepo.findOne({
            name: collegeName,
            type: Unit.college,
        });

        if (!college) {
            college = await this.organizationRepo.create({
                type: Unit.college,
                name: collegeName,
            });

            console.log(`  ✓ Temporary college created: ${collegeName}`);
        } else {
            console.log(`  - Temporary college already exists: ${collegeName}`);
        }

        // Seed temporary department
        const department = await this.organizationRepo.findOne({
            name: departmentName,
            type: Unit.department,
            parent: String(college?._id),
        });

        if (!department) {
            await this.organizationRepo.create({
                type: Unit.department,
                name: departmentName,
                parent: String(college?._id),
            });

            console.log(
                `  ✓ Temporary department created: ${departmentName}`
            );
        } else {
            console.log(
                `  - Temporary department already exists: ${departmentName}`
            );
        }
    }
}


export function createOrganizationSeeder() {
    return new LegacyOrganizationSeeder(
        organizationRepo
    );
}