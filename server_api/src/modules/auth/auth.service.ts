import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CacheService } from "../../util/cache.service";
import { UserRepository } from "../users/user.repository";
import { MailService } from "../mail/mail.service";
import { OrganizationRepository } from "../organization/organization.repository";
import { SettingKey } from "../settings/setting.model";
import { SettingRepository } from "../settings/setting.repository";
import { SettingService } from "../settings/setting.service";

import { IAccount } from '../accounts/account.model';
import { IAccountRepository, AccountRepository } from "../accounts/account.repository";
import { Account_TRANSITIONS } from "../accounts/account.service";
import { AccountStatus } from '../accounts/account.model';
import { ChangePasswordDTO, LoginDto } from "./auth.dto";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { VerfyAccountDto } from '../accounts/account.dto';


export class AuthService {

    constructor(
        private readonly repository: IAccountRepository = new AccountRepository(),
        private readonly applicantRepository = new UserRepository(),
        private readonly mailService = new MailService(),
        private readonly settingService: SettingService = new SettingService(new SettingRepository())
    ) { }

    async login(dto: LoginDto) {

        const { email, password } = dto;

        const userDoc = await this.repository.findByEmail(email);
        if (!userDoc)
            throw new AppError(ERROR_CODES.AUTH_NOT_FOUND);

        if (userDoc.status === AccountStatus.suspended)
            throw new AppError(ERROR_CODES.ACCOUNT_SUSPENDED);

        if (userDoc.lockUntil && userDoc.lockUntil > new Date())
            throw new AppError(ERROR_CODES.ACCOUNT_LOCKED);

        const isMatch = await bcrypt.compare(password, userDoc.password);
        if (!isMatch) {
            await this.handleFailedLogin(userDoc);
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
        }

        const applicantDoc = await this.applicantRepository.findById(
            String(userDoc.applicant),
            true
        );

        if (!applicantDoc)
            throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        const permissions = [
            ...new Set(
                applicantDoc.roles?.flatMap((role: any) =>
                    role.permissions?.map((p: any) => p.name)
                ) || []
            )
        ];

        const ownerships = applicantDoc.ownerships || [];
        const applicantId = String(applicantDoc._id);
        
        CacheService.invalidateUser(applicantId);

        CacheService.setUserPermissions(applicantId, permissions);

        CacheService.setUserOrganizations(
            applicantId,
            ownerships.flatMap((o: any) =>
                o.scope === "*" ? ["*"] : o.scope.map((id: any) => String(id))
            )
        );

        const payload: JwtPayload = {
            applicantId,
            email,
            status: userDoc.status
        };

        const expiryHours =
            await this.settingService.getSettingValue(
                SettingKey.TOKEN_EXPIRY_HOURS,
                2
            );

        const token = jwt.sign(payload, process.env.KEY as string, {
            expiresIn: `${expiryHours}h`
        });

        const userId = String(userDoc._id);
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
                ownerships,
                applicant: applicantDoc
            }
        };
    }

    private async handleFailedLogin(user: IAccount) {
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

        if (!userDoc || userDoc.status === AccountStatus.suspended) {
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

    async resetPassword(data: VerfyAccountDto) {

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

    async activateUser(data: VerfyAccountDto) {

        const { email, resetCode } = data;

        const userDoc = await this.repository.findByEmail(email);

        if (!userDoc) throw new Error("User not found");

        if (!userDoc.resetCode || userDoc.resetCode !== resetCode) {
            throw new Error("Invalid verification code.");
        }

        const current = userDoc.status;
        const nextState = AccountStatus.active;

        TransitionHelper.validateTransition(
            current,
            nextState,
            Account_TRANSITIONS
        );

        await this.repository.update(String(userDoc._id), {
            status: nextState,
            resetCode: "",
            resetCodeExpires: new Date()
        });
    }

}