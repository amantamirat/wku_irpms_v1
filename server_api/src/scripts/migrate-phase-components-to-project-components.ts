import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

/**
 * Copies legacy phasecomponents into projectcomponents without deleting or
 * modifying the source collection. Activity references remain valid because
 * component document _ids are preserved.
 *
 * Run against a backup or staging database first:
 *   PROJECT_COMPONENT_MIGRATION_CONFIRM=YES npx ts-node src/scripts/migrate-phase-components-to-project-components.ts
 */
async function migrate() {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) throw new Error("MONGO_URL is required.");
    if (process.env.PROJECT_COMPONENT_MIGRATION_CONFIRM !== "YES") {
        throw new Error(
            "Refusing to migrate without PROJECT_COMPONENT_MIGRATION_CONFIRM=YES. Back up the database and test on staging first."
        );
    }

    await mongoose.connect(mongoUrl);
    const database = mongoose.connection.db;
    if (!database) throw new Error("MongoDB connection is not ready.");

    const legacyCollection = database.collection("phasecomponents");
    const phaseCollection = database.collection("phases");
    const projectComponentCollection = database.collection("projectcomponents");
    const legacyComponents = await legacyCollection.find({}).toArray();
    let copied = 0;

    for (const legacy of legacyComponents) {
        let projectId = legacy.project;
        if (!projectId && legacy.phase) {
            const phase = await phaseCollection.findOne(
                { _id: legacy.phase },
                { projection: { project: 1 } }
            );
            projectId = phase?.project;
        }
        if (!projectId) {
            throw new Error(`Cannot map legacy component ${String(legacy._id)} to a project.`);
        }

        const { phase: _legacyPhase, ...fields } = legacy;
        const migrated = { ...fields, project: projectId };
        const existing = await projectComponentCollection.findOne({ _id: legacy._id });
        if (existing) {
            if (String(existing.project) !== String(projectId)) {
                throw new Error(
                    `Project component _id conflict for ${String(legacy._id)}; no source data was changed.`
                );
            }
            continue;
        }

        await projectComponentCollection.insertOne(migrated);
        copied += 1;
    }

    await projectComponentCollection.createIndex({ project: 1 });
    await projectComponentCollection.createIndex({ project: 1, title: 1 });
    console.log(`Copied ${copied} component(s). Legacy phasecomponents were left unchanged.`);
}

migrate()
    .catch(error => {
        console.error("Project component migration failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
