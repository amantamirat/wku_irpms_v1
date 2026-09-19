import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CacheService } from "../../util/cache.service";
import { AccountStatus, IAccount } from '../accounts/account.model';
import { IAccountRepository } from "../accounts/account.repository";
import { MailService, VerificationCodePurpose } from "../mail/mail.service";
import { SettingKey } from "../settings/setting.model";
import { SettingService } from "../settings/setting.service";
import { IUserRepository } from "../users/user.repository";
import { ActivateAccountDTO, ChangePasswordDTO, LoginDto, ResetPasswordDto } from "./auth.dto";


export class AuthService {

    constructor(
        private readonly repository: IAccountRepository,
        private readonly userRepository: IUserRepository,
        private readonly settingService: SettingService,
        private readonly mailService = new MailService(),
    ) { }

    async login(dto: LoginDto) {

        const { email, password } = dto;

        const accountDoc = await this.repository.findByEmail(email);
        if (!accountDoc)
            throw new AppError(ERROR_CODES.ACCOUNT_NOT_FOUND);

        if (accountDoc.status === AccountStatus.suspended)
            throw new AppError(ERROR_CODES.ACCOUNT_SUSPENDED,
                "Account is suspended. Contact support.");

        if (accountDoc.lockUntil && accountDoc.lockUntil > new Date())
            throw new AppError(ERROR_CODES.ACCOUNT_LOCKED,
                "Account temporarily locked due to too many failed login attempts");

        const isMatch = await bcrypt.compare(password, accountDoc.password);
        if (!isMatch) {
            await this.handleFailedLogin(accountDoc);
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
        }

        // Password is correct from here
        if (accountDoc.status === AccountStatus.pending) {
            await this.sendCode(email, "activation");
            throw new AppError(
                ERROR_CODES.ACCOUNT_PENDING,
                "Account is not activated. A verification code has been sent to your email."
            );
        }

        const accountId = String(accountDoc._id);

        const userDoc = await this.userRepository.findById(
            String(accountDoc.user), { populate: true }
        );

        if (!userDoc)
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);

        const permissions = [
            ...new Set(
                userDoc.roles?.flatMap((role: any) =>
                    role.permissions?.map((p: any) => p.name)
                ) || []
            )
        ];

        const ownerships = userDoc.ownerships || [];
        const userId = String(userDoc._id);


        CacheService.invalidateUser(userId);

        CacheService.setUserPermissions(userId, permissions);

        CacheService.setUserOrganizations(
            userId,
            ownerships.flatMap((o: any) =>
                o.scope === "*" ? ["*"] : o.scope.map((id: any) => String(id))
            )
        );

        const payload: JwtPayload = {
            accountId,
            userId: userId,
            email,
            status: accountDoc.status
        };

        const expiryHours =
            await this.settingService.getSettingValue(
                SettingKey.TOKEN_EXPIRY_HOURS,
                2
            );

        const token = jwt.sign(payload, process.env.KEY as string, {
            expiresIn: `${expiryHours}h`
        });


        await this.repository.update(accountId, {
            lastLogin: new Date(),
            failedLoginAttempts: 0,
            lockUntil: null,
            resetCode: null,
            resetCodeExpires: null
        });

        return {
            token,
            user: {
                _id: userDoc._id,
                name: userDoc.name,
                email: accountDoc.email,
            },
            permissions,
            ownerships,
            status: accountDoc.status
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

        const accountDoc = await this.repository.findById(id);
        if (!accountDoc) throw new AppError(ERROR_CODES.ACCOUNT_NOT_FOUND);

        const isMatch = await bcrypt.compare(currentPassword, accountDoc.password);
        if (!isMatch) throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, "Current password is incorrect");

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.repository.update(id, { password: hashed });
    }

    async sendCode(email: string, purpose: VerificationCodePurpose): Promise<void> {
        const accountDoc = await this.repository.findByEmail(email);
        if (!accountDoc) {
            throw new AppError(
                ERROR_CODES.EMAIL_NOT_FOUND,
                "No account is associated with this email address."
            );
        }
        if (accountDoc.status === AccountStatus.suspended) {
            throw new AppError(ERROR_CODES.ACCOUNT_SUSPENDED, "Account is suspended. Contact support.");
        }
        if (accountDoc.lockUntil && accountDoc.lockUntil > new Date()) {
            const remainingMinutes = Math.ceil(
                (accountDoc.lockUntil.getTime() - Date.now()) / 60000
            );

            throw new AppError(
                ERROR_CODES.ACCOUNT_LOCKED,
                `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`
            );
        }

        const now = new Date();
        const bufferTime = 90 * 60 * 1000;

        if (
            accountDoc.resetCode &&
            accountDoc.resetCodeExpires &&
            accountDoc.resetCodeExpires.getTime() - now.getTime() > bufferTime
        ) {
            return;
        }

        const code = crypto.randomInt(100000000, 999999999).toString();

        const expiryMinutes = await this.settingService.getSettingValue(
            SettingKey.VERIFICATION_CODE_EXPIRY_MIN,
            10
        );
        const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

        await this.mailService.sendCode(accountDoc.email, code, expiry, purpose);

        await this.repository.update(String(accountDoc._id), {
            resetCode: code,
            resetCodeExpires: expiry
        });
    }

    async resetPassword(data: ResetPasswordDto) {
        const { email, resetCode, password } = data;
        const accountDoc = await this.repository.findByEmail(email);
        if (!accountDoc) throw new AppError(ERROR_CODES.ACCOUNT_NOT_FOUND);
        if (!accountDoc.resetCode || accountDoc.resetCode !== resetCode) {
            throw new AppError(ERROR_CODES.INVALID_VERIFICATION_CODE, "Invalid verification code.");
        }

        if (!accountDoc.resetCodeExpires || accountDoc.resetCodeExpires < new Date()) {
            throw new AppError(ERROR_CODES.VERIFICATION_CODE_EXPIRED, "Verification code expired.");
        }

        const hashed = await bcrypt.hash(password ?? "", 10);

        await this.repository.update(String(accountDoc._id), {
            password: hashed,
            resetCode: null,
            resetCodeExpires: null,
            status:AccountStatus.active
        });
    }

    async activateAccount(data: ActivateAccountDTO) {
        const { email, resetCode } = data;
        const accountDoc = await this.repository.findByEmail(email);
        if (!accountDoc) {
            throw new AppError(
                ERROR_CODES.EMAIL_NOT_FOUND,
                "No account is associated with this email address."
            );
        }
        if (!accountDoc.resetCode || accountDoc.resetCode !== resetCode) {
            throw new AppError(ERROR_CODES.INVALID_VERIFICATION_CODE, "Invalid verification code.");
        }
        if (!accountDoc.resetCodeExpires || accountDoc.resetCodeExpires < new Date()) {
            throw new AppError(ERROR_CODES.VERIFICATION_CODE_EXPIRED, "Verification code expired.");
        }
        /*
        const current = accountDoc.status;
        const nextState = AccountStatus.active;
        TransitionHelper.validateTransition(
            current,
            nextState,
            Account_TRANSITIONS
        );*/

        await this.repository.update(String(accountDoc._id), {
            status: AccountStatus.active,
            resetCode: null,
            resetCodeExpires: null
        });
    }



}