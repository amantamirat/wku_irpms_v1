
import fs from "fs/promises";
import path from "path";

import { Unit } from "../../../common/constants/enums";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";

import {
    organizationRepo,
    userService,
    accountService
} from "../../../core/container";

import { AccountService } from "../../../modules/accounts/account.service";
import { IOrganizationRepository } from "../../../modules/organization/organization.repository";
import { UserService } from "../../../modules/users/user.service";
import { Ownership } from "../../../modules/organization/organization.enum";
import { Gender } from "../../../modules/users/user.model";


export class UserSeeder {

    constructor(
        private readonly organizationRepo: IOrganizationRepository,
        private readonly userService: UserService,
        private readonly accountService: AccountService
    ) { }


    /**
     * Parse researcher name.
     */
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


    /**
     * Generate email from parsed name.
     *
     * Example:
     * Abebe Kebede       -> abebe.kebede@gmail.com
     * Abebe Getachew     -> abebe.getachew@gmail.com
     * Abebe Getachew Kebede -> abebe.getachew@gmail.com
     */
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

        return `${parts[0]}.${parts[1]}@gmail.com`;
    }


    /**
     * Use provided email or generate one.
     */
    private resolveEmail(email: string | undefined, name: string): string {

        const providedEmail = email?.trim();

        if (
            providedEmail &&
            providedEmail.toUpperCase() !== "N/A"
        ) {
            return providedEmail.toLowerCase();
        }

        return this.buildEmail(name);
    }


    /**
     * Find existing organization or create a new one.
     */
    private async findOrCreateOrganization(name: string) {

        const organizationName = name?.trim();

        if (!organizationName) {
            throw new AppError(
                ERROR_CODES.INVALID_USER,
                "Researcher institution is missing"
            );
        }

        let organization = await this.organizationRepo.findOne({
            name: organizationName
        });

        if (!organization) {

            organization = await this.organizationRepo.create({
                type: Unit.external,
                name: organizationName,
                ownership: Ownership.Public
            });

            console.log(
                `✅ Created organization: ${organizationName}`
            );
        }

        return organization;
    }


    /**
     * Main seeding process.
     */
    async run() {

        console.log("🚀 Starting researcher user seeding...");

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
            "data/external",
            "researchers.json"
        );

        const rawData = await fs.readFile(
            filePath,
            "utf-8"
        );

        const data = JSON.parse(rawData);

        // Support both array and object JSON structures.
        const users = Array.isArray(data)
            ? data
            : data.records ?? [];

        let seeded = false;

        let createdUsers = 0;
        let createdAccounts = 0;
        let createdOrganizations = 0;


        for (const item of users) {

            try {

                // 1. Find or create organization.
                const organizationName = item.institution;

                const existingOrganization =
                    await this.organizationRepo.findOne({
                        name: organizationName?.trim()
                    });

                const organization =
                    existingOrganization ??
                    await this.findOrCreateOrganization(
                        organizationName
                    );

                if (!existingOrganization) {
                    createdOrganizations++;
                }


                // 2. Parse researcher name.
                const parsed = this.parseName(item.name);

                if (!parsed.name) {
                    throw new AppError(
                        ERROR_CODES.INVALID_USER,
                        "Researcher name is missing"
                    );
                }

                if (!organization) {
                    continue;
                }

                // 3. Find existing user.
                let userDoc = await this.userService.findOne({
                    workspace: String(organization._id),
                    name: parsed.name
                });


                // 4. Create user if not found.
                if (!userDoc) {

                    userDoc = await this.userService.create({
                        name: parsed.name,
                        workspace: String(organization._id),
                        gender: Gender.Male
                    });

                    seeded = true;
                    createdUsers++;

                    console.log(
                        `✅ Created user: ${parsed.name}`
                    );
                }


                // 5. Create account if password is configured.
                if (defaultPassword) {

                    const email = this.resolveEmail(
                        item.email,
                        parsed.name
                    );

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

                        console.log(
                            `✅ Created account: ${email}`
                        );

                    } else {

                        console.log(
                            `ℹ️ Account already exists for ${parsed.name}`
                        );
                    }
                }

            } catch (error) {

                console.error(
                    `❌ Failed to seed ${item.name ?? "unknown researcher"}:`,
                    error
                );
            }
        }


        console.log(`
========================================
        Researcher User Seeding
========================================
Users processed        : ${users.length}
Users created          : ${createdUsers}
Organizations created  : ${createdOrganizations}
Accounts created       : ${createdAccounts}
========================================
`);


        return {
            users: createdUsers,
            organizations: createdOrganizations,
            accounts: createdAccounts,
            seeded
        };
    }
}


/**
 * Seeder factory.
 */
export function createExternalUserSeeder() {

    return new UserSeeder(
        organizationRepo,
        userService,
        accountService
    );
}
