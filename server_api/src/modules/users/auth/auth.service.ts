import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SYSTEM } from "../../../common/constants/system.constant";
import { CacheService } from "../../../util/cache/cache.service";
import { IOwnership } from "../../applicants/applicant.model";
import { ApplicantRepository } from "../../applicants/applicant.repository";
import { MailService } from "../../mail/mail.service";
import { OrganizationRepository } from "../../organization/organization.repository";
import { PermissionRepository } from "../../permissions/permission.repository";
import { LoginDto } from "./auth.dto";
import { ChangePasswordDTO, VerfyUserDto } from "../user.dto";
import { IUserRepository, UserRepository } from "../user.repository";
import { UserStateMachine } from "../user.state-machine";
import { UserStatus } from "../user.status";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { SettingService } from "../../settings/setting.service";
import { SettingRepository } from "../../settings/setting.repository";
import { SettingKey } from "../../settings/setting.model";
import { IUser } from "../user.model";
import { Unit } from "../../../common/constants/enums";


export class AuthService {

    constructor(
        private readonly repository: IUserRepository = new UserRepository(),
        private readonly applicantRepository = new ApplicantRepository(),
        private readonly organizationRepository = new OrganizationRepository(),
        private readonly mailService = new MailService(),
        private readonly settingService: SettingService = new SettingService(new SettingRepository())
    ) { }

    async login(dto: LoginDto) {

        const { email, password } = dto;
        const userDoc = await this.repository.findByEmail(email);
        if (!userDoc)
            throw new AppError(ERROR_CODES.ACCOUNT_NOT_FOUND);

        if (userDoc.status === UserStatus.suspended)
            throw new AppError(ERROR_CODES.ACCOUNT_SUSPENDED);

        // Check lock
        if (userDoc.lockUntil && userDoc.lockUntil > new Date()) {
            throw new AppError(ERROR_CODES.ACCOUNT_LOCKED);
        }

        const isMatch = await bcrypt.compare(password, userDoc.password);

        if (!isMatch) {
            await this.handleFailedLogin(userDoc);
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
        }

        const userId = String(userDoc._id);
        const applicantId = String(userDoc.applicant);

        const applicantDoc = await this.applicantRepository.findById(applicantId, true);

        if (!applicantDoc) {
            throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);
        }

        const permissions = applicantDoc.roles?.flatMap((role: any) =>
            role.permissions?.map((p: any) => p.name)) || [];

        const ownerships = applicantDoc.ownerships;

        CacheService.setUserPermissions(userId, permissions);
        CacheService.setUserOwnerships(userId, ownerships);

        const ownershipsDocs = await Promise.all(
            (ownerships || []).map(async (ownership: any) => {

                if (ownership.scope === "*") return ownership;

                const populatedScope = await this.organizationRepository.findByIds(
                    ownership.scope
                );

                return {
                    ...ownership,
                    scope: populatedScope
                };

            })
        );

        const payload: JwtPayload = {
            userId,
            applicantId,
            email,
            status: userDoc.status
        };

        const token = jwt.sign(payload, process.env.KEY as string, { expiresIn: "2h" });

        await this.repository.update(userId, {
            lastLogin: new Date(),
            failedLoginAttempts: 0,
            lockUntil: null
        });

        return {
            token,
            user: {
                ...payload,
                permissions,
                ownerships: ownershipsDocs,
                applicant: applicantDoc
            }
        };
    }

    private async handleFailedLogin(user: IUser) {
        const maxAttempts = await this.settingService.getSettingValue(SettingKey.MAX_LOGIN_ATTEMPTS, 5);
        const lockDurationMinutes = await this.settingService.getSettingValue(SettingKey.ACCOUNT_LOCK_MIN, 15);

        const newAttempts = (user.failedLoginAttempts || 0) + 1;
        const updates: any = { failedLoginAttempts: newAttempts };

        if (newAttempts >= maxAttempts) {
            updates.lockUntil = new Date(Date.now() + lockDurationMinutes * 60000);
        }

        await this.repository.update(String(user._id), updates);
    }

    async changePassword(dto: ChangePasswordDTO) {

        const { id, data } = dto;
        const { currentPassword, password: newPassword } = data;

        const user = await this.repository.findById(id);

        if (!user) throw new Error("User not found");

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) throw new Error("Current password is incorrect");

        const hashed = await bcrypt.hash(newPassword, 10);

        await this.repository.update(id, { password: hashed });
    }

    async sendCode(email: string): Promise<void> {

        const userDoc = await this.repository.findByEmail(email);

        if (!userDoc || userDoc.status === UserStatus.suspended) {
            throw new Error("User does not exist.");
        }

        const now = new Date();
        const bufferTime = 90 * 60 * 1000;

        if (
            userDoc.resetCode &&
            userDoc.resetCodeExpires &&
            userDoc.resetCodeExpires.getTime() - now.getTime() > bufferTime
        ) {
            return;
        }

        const code = crypto.randomInt(100000000, 999999999).toString();
        const expiry = new Date(Date.now() + 120 * 60 * 1000);

        await this.mailService.sendVerificationCode(userDoc.email, code);

        await this.repository.update(String(userDoc._id), {
            resetCode: code,
            resetCodeExpires: expiry
        });
    }

    async resetPassword(data: VerfyUserDto) {

        const { email, resetCode, password } = data;

        const userDoc = await this.repository.findByEmail(email);

        if (!userDoc) throw new Error("User not found");

        if (!userDoc.resetCode || userDoc.resetCode !== resetCode) {
            throw new Error("Invalid verification code.");
        }

        if (!userDoc.resetCodeExpires || userDoc.resetCodeExpires < new Date()) {
            throw new Error("Verification code expired.");
        }

        const hashed = await bcrypt.hash(password ?? "", 10);

        await this.repository.update(String(userDoc._id), {
            password: hashed,
            resetCode: "",
            resetCodeExpires: new Date()
        });
    }

    async activateUser(data: VerfyUserDto) {

        const { email, resetCode } = data;

        const userDoc = await this.repository.findByEmail(email);

        if (!userDoc) throw new Error("User not found");

        if (!userDoc.resetCode || userDoc.resetCode !== resetCode) {
            throw new Error("Invalid verification code.");
        }

        const current = userDoc.status;
        const nextState = UserStatus.active;

        UserStateMachine.validateTransition(current, nextState);

        await this.repository.update(String(userDoc._id), {
            status: nextState,
            resetCode: "",
            resetCodeExpires: new Date()
        });
    }

}