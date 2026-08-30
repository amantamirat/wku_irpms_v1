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
    criterionRepo,
    evaluationRepo,
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
import { ICriterionRepository } from "../../modules/evaluations/criteria/criterion.repository";
import { IEvaluationRepository } from "../../modules/evaluations/evaluation.repository";
import { EvalStatus } from "../../modules/evaluations/evaluation.state-machine";

interface DemoTheme {
    title: string;
    priority: number;
    children?: DemoTheme[];
}

interface DemoThematic {
    thematic: {
        title: string;
        level: ThematicLevel;
        description?: string;
    };
    themes: DemoTheme[];
}
export class DemoSeeder {

    constructor(
        private readonly specializationRepo: ISpecializationRepository,
        private readonly positionRepo: IPositionRepository,
        private readonly thematicRepo: IThematicRepository,
        private readonly themeRepo: IThemeRepository,
        private readonly evaluationRepo: IEvaluationRepository,
        private readonly criterionRepo: ICriterionRepository,
    ) { }

    async run(): Promise<void> {
        console.log("🌱 Demo Data Seeding Started...");

        await this.seedSpecializations();
        await this.seedPositions();
        await this.seedThemes();
        await this.seedEvaluations();

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
    // THEMATICS + THEMES
    // ==================================================

    private async seedThemes(): Promise<void> {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/demo",
                "themes.json"
            );

            const rawData = await fs.readFile(filePath, "utf-8");

            const thematics: DemoThematic[] =
                JSON.parse(rawData);

            if (!Array.isArray(thematics)) {
                console.error(
                    "❌ Demo thematics must be an array"
                );
                return;
            }

            let thematicsSeeded = false;
            let themesSeeded = false;

            for (const item of thematics) {

                // ------------------------------------------
                // VALIDATE THEMATIC INFORMATION
                // ------------------------------------------

                if (
                    !item.thematic?.title ||
                    !item.thematic?.level
                ) {
                    continue;
                }

                const {
                    title,
                    level,
                    description
                } = item.thematic;

                // ------------------------------------------
                // FIND OR CREATE THEMATIC
                // ------------------------------------------

                let thematic =
                    await this.thematicRepo.findOne({
                        title,
                        level
                    });

                if (!thematic) {

                    thematic =
                        await this.thematicRepo.create({
                            title,
                            level,
                            description
                        });

                    thematicsSeeded = true;
                }

                const thematicId =
                    String(thematic._id);

                // ------------------------------------------
                // SEED THEMES
                // ------------------------------------------

                if (!Array.isArray(item.themes)) {
                    continue;
                }

                for (const theme of item.themes) {

                    if (!theme.title) {
                        continue;
                    }

                    const seeded =
                        await this.seedThemeRecursive(
                            theme,
                            thematicId,
                            undefined,
                            0
                        );

                    if (seeded) {
                        themesSeeded = true;
                    }
                }
            }

            // ------------------------------------------
            // LOG RESULT
            // ------------------------------------------

            if (thematicsSeeded) {
                console.log(
                    "✅ Demo thematics seeded"
                );
            }

            if (themesSeeded) {
                console.log(
                    "✅ Demo themes seeded"
                );
            }

        } catch (error) {

            console.error(
                "❌ Error seeding demo thematics:",
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
        // FIND EXISTING THEME
        // ------------------------------------------

        const filter: Record<string, unknown> = {
            title: item.title,
            thematicArea: thematicId,
            parent: parent ?? undefined
        };

        let theme =
            await this.themeRepo.findOne(filter);

        let seeded = false;

        // ------------------------------------------
        // CREATE THEME
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
        // SEED CHILDREN
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


    // ==================================================
    // EVALUATIONS + CRITERIA
    // ==================================================

    private async seedEvaluations(): Promise<void> {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/demo",
                "evaluations.json"
            );

            const rawData = await fs.readFile(filePath, "utf-8");

            const evaluations = JSON.parse(rawData);

            if (!Array.isArray(evaluations)) {
                console.error(
                    "❌ Demo evaluations must be an array"
                );
                return;
            }

            let evaluationsSeeded = false;
            let criteriaSeeded = false;

            for (const item of evaluations) {

                if (!item.title) {
                    continue;
                }

                // ------------------------------------------
                // FIND OR CREATE EVALUATION
                // ------------------------------------------

                let evaluation =
                    await this.evaluationRepo.findOne({
                        title: item.title
                    });

                if (!evaluation) {

                    evaluation =
                        await this.evaluationRepo.create({
                            title: item.title,
                            description: item.description,
                            weight: item.weight ?? 100,
                            status: EvalStatus.draft
                        });

                    evaluationsSeeded = true;
                }

                // ------------------------------------------
                // SEED CRITERIA
                // ------------------------------------------

                if (!Array.isArray(item.criteria)) {
                    continue;
                }

                for (let index = 0; index < item.criteria.length; index++) {

                    const criterion = item.criteria[index];

                    if (!criterion.title) {
                        continue;
                    }

                    // --------------------------------------
                    // CHECK EXISTING CRITERION
                    // --------------------------------------

                    const exists =
                        await this.criterionRepo.findOne({
                            evaluation: String(evaluation._id),
                            title: criterion.title
                        });

                    if (exists) {
                        continue;
                    }

                    // --------------------------------------
                    // CREATE CRITERION
                    // --------------------------------------

                    await this.criterionRepo.create({
                        evaluation: String(evaluation._id),
                        title: criterion.title,
                        weight: criterion.weight ?? 0,
                        formType: criterion.formType,
                        options: criterion.options,
                        order: criterion.order ?? index,
                        isRequired: criterion.isRequired ?? true
                    });

                    criteriaSeeded = true;
                }
            }

            // ------------------------------------------
            // LOG RESULT
            // ------------------------------------------

            if (evaluationsSeeded) {
                console.log("✅ Demo evaluations seeded");
            }

            if (criteriaSeeded) {
                console.log("✅ Demo evaluation criteria seeded");
            }

        } catch (error) {
            console.error(
                "❌ Error seeding demo evaluations:",
                error
            );
        }
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
        themeRepo,
        evaluationRepo,
        criterionRepo
    );
}

