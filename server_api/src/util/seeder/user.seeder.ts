import fs from "fs/promises";
import path from "path";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { AccountService } from "../../modules/accounts/account.service";
import { IOrganizationRepository } from "../../modules/organization/organization.repository";
import { UserService } from "../../modules/users/user.service";
import { accountService, organizationRepo, userService } from "../../core/container";


export class UserSeeder {

    constructor(
        private readonly organizationRepo: IOrganizationRepository,
        private readonly userService: UserService,
        private readonly accountService: AccountService
    ) { }


    private parseName(raw: string) {
        const clean = raw
            .replace(/\t/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^dr\.\s*/i, "");

        const positionMatch = clean.match(/\((.*?)\)/);

        const position = positionMatch
            ? positionMatch[1].trim()
            : null;

        const name = clean
            .replace(/\(.*?\)/, "")
            .trim();

        return {
            name,
            position
        };
    }


    private buildEmail(name: string): string {

        const parts = name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s]+/g, " ")
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length < 2) {
            throw new AppError(
                ERROR_CODES.INVALID_USER,
                `Cannot generate email for ${name}`
            );
        }

        return `${parts[0]}.${parts[1]}@wku.edu.et`;
    }


    async run() {

        console.log("🚀 Starting user seeding...");

        const defaultPassword =
            process.env.SEEDER_DEFAULT_PASSWORD;

        if (!defaultPassword) {
            console.warn(
                "⚠️ SEEDER_DEFAULT_PASSWORD is not configured. " +
                "Users will be seeded, but accounts will not be created."
            );
        }


        const filePath = path.join(
            process.cwd(),
            "data/legacy",
            "researchers.json"
        );

        const rawData =
            await fs.readFile(filePath, "utf-8");

        const users = JSON.parse(rawData);

        let seeded = false;
        let createdUsers = 0;
        let createdAccounts = 0;


        for (const item of users) {

            const departmentName = item.Department;

            const department =
                await this.organizationRepo.findOne({
                    name: departmentName
                });


            if (!department) {

                console.warn(
                    `Department ${departmentName} does not exist`
                );

                continue;
            }


            const parsed =
                this.parseName(item.Name);


            let userDoc =
                await this.userService.findOne({
                    workspace: String(department._id),
                    name: parsed.name
                });


            if (!userDoc) {

                userDoc =
                    await this.userService.create({
                        name: parsed.name,
                        workspace: String(department._id),
                        gender: item.Gender
                    });

                seeded = true;
                createdUsers++;
            }


            // Create account only when password is configured
            if (defaultPassword) {

                const email =
                    this.buildEmail(parsed.name);

                const emailExists =
                    await this.accountService.exists({
                        email
                    });

                const userExists =
                    await this.accountService.exists({
                        user: String(userDoc._id)
                    });


                if (!emailExists && !userExists) {

                    await this.accountService.create({
                        user: String(userDoc._id),
                        email,
                        password: defaultPassword
                    });

                    createdAccounts++;
                }
            }
        }


        console.log(`
========================================
           User Seeding
========================================
Users processed   : ${users.length}
Users created     : ${createdUsers}
Accounts created  : ${createdAccounts}
========================================
`);

        return {
            users: createdUsers,
            accounts: createdAccounts,
            seeded
        };
    }
}


export function createUserSeeder() {
    return new UserSeeder(
        organizationRepo, userService, accountService
    );
}