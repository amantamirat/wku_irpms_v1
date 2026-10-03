import dotenv from "dotenv";
import mongoose from "mongoose";
import { createDemoSeeder } from "../util/seeder/demo.seed";
import { createLegacySeeder } from "../util/seeder/legacy/legacy.seed";
import { createSystemSeeder } from "../util/seeder/system.seed";
import { createNewLegacySeeder } from "../util/seeder/new-legacy/new-legacy.seed";
import { createUserSeeder } from "../util/seeder/user.seeder";
import { createOrganizationSeeder } from "../util/seeder/organization.seeder";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function main() {
    if (!MONGO_URL) {
        throw new Error("MONGO_URL is not set in environment variables.");
    }

    await mongoose.connect(MONGO_URL);

    console.log("Database connection established.");

    const command = process.argv[2];

    switch (command) {
        case "system":
            await createSystemSeeder().run();
            break;

        case "demo":
            await createDemoSeeder().run();
            break;

        case "org":
            await createOrganizationSeeder().run();
            break;

        case "user":
            await createUserSeeder().run();
            break;

            /*
        case "legacy":
            await createLegacySeeder().run();
            break;*/

        case "legacy":
            await createNewLegacySeeder().run();
            break;

        case "all":
            await createSystemSeeder().run();
            await createDemoSeeder().run();
            await createLegacySeeder().run();
            break;

        default:
            console.log(`Available seed commands:
                npm run seed system
                npm run seed demo
                npm run seed legacy
                npm run seed all
            `);
            break;
    }

    await mongoose.disconnect();

    console.log("Database connection closed.");
}

main().catch(async (error) => {
    console.error("❌ Seeding failed:", error);

    await mongoose.disconnect().catch(() => { });

    process.exit(1);
});