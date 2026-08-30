import fs from "fs/promises";
import path from "path";

import { AcademicLevel } from "../../common/constants/enums";

import {
    ISpecializationRepository
} from "../../modules/organization/specializations/specialization.repository";

import {
    IPositionRepository
} from "../../modules/positions/position.repository";

import {
    positionRepo,
    specializationRepo,
    thematicRepo,
    themeRepo
} from "../../core/container";

import {
    IThematicRepository
} from "../../modules/thematics/thematic.repository";

import {
    IThemeRepository
} from "../../modules/thematics/themes/theme.repository";

import {
    ThematicLevel
} from "../../modules/thematics/thematic.enum";

interface DemoTheme {
    title: string;
    priority: number;
    children?: DemoTheme[];
}

export class DemoSeeder {

    constructor(
        private readonly specializationRepo: ISpecializationRepository,
        private readonly positionRepo: IPositionRepository,
        private readonly thematicRepo: IThematicRepository,
        private readonly themeRepo: IThemeRepository,
    ) { }

    async run(): Promise<void> {
        console.log("🌱 Demo Data Seeding Started...");

        await this.seedSpecializations();
        await this.seedPositions();
        await this.seedNarrowThematics();

        console.log("✅ Demo Data Seeding Finished.");
    }

    // ==================================================
    // SPECIALIZATIONS
    // ==================================================

    private async seedSpecializations(): Promise<void> {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/demo",
                "specializations.json"
            );

            const rawData = await fs.readFile(filePath, "utf-8");
            const specializations = JSON.parse(rawData);

            if (!Array.isArray(specializations)) {
                console.error(
                    "❌ Demo specializations must be an array"
                );
                return;
            }

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

                if (exists) {
                    continue;
                }

                await this.specializationRepo.create({
                    name: item.name,
                    academicLevel:
                        item.academicLevel as AcademicLevel
                });

                seeded = true;
            }

            if (seeded) {
                console.log("✅ Demo specializations seeded");
            }

        } catch (error) {
            console.error(
                "❌ Error seeding demo specializations:",
                error
            );
        }
    }

    // ==================================================
    // POSITIONS
    // ==================================================

    private async seedPositions(): Promise<void> {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/demo",
                "positions.json"
            );

            const rawData = await fs.readFile(filePath, "utf-8");
            const positions = JSON.parse(rawData);

            if (!Array.isArray(positions)) {
                console.error(
                    "❌ Demo positions must be an array"
                );
                return;
            }

            let seeded = false;

            for (const item of positions) {

                if (!item.name) {
                    continue;
                }

                const exists =
                    await this.positionRepo.findByName(
                        item.name
                    );

                if (exists) {
                    continue;
                }

                await this.positionRepo.create({
                    name: item.name
                });

                seeded = true;
            }

            if (seeded) {
                console.log("✅ Demo positions seeded");
            }

        } catch (error) {
            console.error(
                "❌ Error seeding demo positions:",
                error
            );
        }
    }

    // ==================================================
    // ONE THEMATIC + ALL NARROW THEMES
    // ==================================================

    private async seedNarrowThematics(): Promise<void> {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/demo",
                "wku-narrow-thematics.json"
            );

            const rawData = await fs.readFile(filePath, "utf-8");

            const themes: DemoTheme[] =
                JSON.parse(rawData);

            if (!Array.isArray(themes)) {
                console.error(
                    "❌ WKU narrow thematics must be an array"
                );
                return;
            }

            // ==================================================
            // CREATE ONE THEMATIC FOR THE ENTIRE FILE
            // ==================================================

            const thematicTitle = "WKU Narrow Thematics";

            let thematic =
                await this.thematicRepo.findOne({
                    title: thematicTitle,
                    level: ThematicLevel.narrow
                });

            let thematicCreated = false;

            if (!thematic) {

                thematic =
                    await this.thematicRepo.create({
                        title: thematicTitle,
                        level: ThematicLevel.narrow
                    });

                thematicCreated = true;
            }

            // ==================================================
            // SEED ALL TOP-LEVEL THEMES UNDER THIS THEMATIC
            // ==================================================

            let themesSeeded = false;

            for (const item of themes) {

                if (!item.title) {
                    continue;
                }

                const created =
                    await this.seedThemeRecursive(
                        item,
                        String(thematic._id),
                        undefined,
                        0
                    );

                if (created) {
                    themesSeeded = true;
                }
            }

            // ==================================================
            // LOG RESULT
            // ==================================================

            if (thematicCreated || themesSeeded) {
                console.log(
                    "✅ WKU narrow thematic and themes seeded"
                );
            }

        } catch (error) {
            console.error(
                "❌ Error seeding WKU narrow thematics:",
                error
            );
        }
    }

    // ==================================================
    // RECURSIVE THEME SEEDER
    // ==================================================

    private async seedThemeRecursive(
        item: DemoTheme,
        thematicId: string,
        parent: string | undefined,
        level: number
    ): Promise<boolean> {

        if (!item.title) {
            return false;
        }

        // ------------------------------------------
        // Find existing theme
        // ------------------------------------------

        const filter: Record<string, unknown> = {
            title: item.title,
            thematicArea: thematicId
        };

        if (parent) {
            filter.parent = parent;
        } else {
            filter.parent = undefined;
        }

        let theme =
            await this.themeRepo.findOne(filter);

        let seeded = false;

        // ------------------------------------------
        // Create theme
        // ------------------------------------------

        if (!theme) {

            theme =
                await this.themeRepo.create({
                    title: item.title,
                    priority: item.priority,
                    thematicArea: thematicId,
                    parent,
                    level
                });

            seeded = true;
        }

        // ------------------------------------------
        // Create children recursively
        // ------------------------------------------

        if (!item.children?.length) {
            return seeded;
        }

        for (const child of item.children) {

            const childSeeded =
                await this.seedThemeRecursive(
                    child,
                    thematicId,
                    String(theme._id),
                    level + 1
                );

            if (childSeeded) {
                seeded = true;
            }
        }

        return seeded;
    }
}

// ==================================================
// FACTORY
// ==================================================

export function createDemoSeeder() {
    return new DemoSeeder(
        specializationRepo,
        positionRepo,
        thematicRepo,
        themeRepo
    );
}

