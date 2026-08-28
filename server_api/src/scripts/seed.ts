import mongoose from "mongoose";
import dotenv from "dotenv";
import { SystemSeeder } from "../util/system.seed";
import { SampleSeeder } from "../util/sample.seed";

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
            await new SystemSeeder().run();
            break;

        case "sample":
            await new SampleSeeder().run();
            break;

        case "all":
            await new SystemSeeder().run();
            await new SampleSeeder().run();
            break;

        default:
            console.log(`Available seed commands:
                npm run seed system
                npm run seed sample
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