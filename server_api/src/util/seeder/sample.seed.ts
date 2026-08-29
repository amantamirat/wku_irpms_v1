import fs from "fs/promises";
import path from "path";

import { AcademicLevel } from "../../common/constants/enums";
import { ISpecializationRepository } from "../../modules/organization/specializations/specialization.repository";
import { IPositionRepository } from "../../modules/positions/position.repository";
import { positionRepo, specializationRepo } from "../../core/container";

export class SampleSeeder {
    constructor(
        private readonly specializationRepo: ISpecializationRepository,
        private readonly positionRepo: IPositionRepository,
    ) { }

    async run(): Promise<void> {
        console.log("🌱 Sample Data Seeding Started...");

        await this.seedSpecializations();
        await this.seedPositions();

        console.log("✅ Sample Data Seeding Finished.");
    }

    private async seedSpecializations(): Promise<void> {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/sample",
                "specializations.json"
            );

            const rawData = await fs.readFile(filePath, "utf-8");
            const specializations = JSON.parse(rawData);

            let seeded = false;

            for (const item of specializations) {
                if (!item.name || !item.academicLevel) {
                    continue;
                }

                const exists =
                    await this.specializationRepo.findByNameAndLevel(
                        item.name,
                        item.academicLevel
                    );

                if (exists) continue;

                await this.specializationRepo.create({
                    name: item.name,
                    academicLevel: item.academicLevel as AcademicLevel
                });

                seeded = true;
            }

            if (seeded) {
                console.log("✅ Sample specializations seeded");
            }
        } catch (error) {
            console.error(
                "❌ Error seeding sample specializations:",
                error
            );
        }
    }

    private async seedPositions(): Promise<void> {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/sample",
                "positions.json"
            );

            const rawData = await fs.readFile(filePath, "utf-8");
            const positions = JSON.parse(rawData);

            let seeded = false;

            for (const item of positions) {
                if (!item.name) continue;

                const exists =
                    await this.positionRepo.findByName(item.name);

                if (exists) continue;

                await this.positionRepo.create({
                    name: item.name
                });

                seeded = true;
            }

            if (seeded) {
                console.log("✅ Sample positions seeded");
            }
        } catch (error) {
            console.error(
                "❌ Error seeding sample positions:",
                error
            );
        }
    }
}

export function createSampleSeeder() {
    return new SampleSeeder(
        specializationRepo,
        positionRepo
    );
}

