import bcrypt from "bcryptjs";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { IUserRepository, UserRepository } from "../users/user.repository";
import { CreateAccountDTO, FilterAccountDTO, UpdateAccountDTO } from "./account.dto";
import { AccountStatus } from "./account.model";
import { IAccountRepository, AccountRepository } from "./account.repository";


export const Account_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
    [AccountStatus.pending]: [AccountStatus.active],
    [AccountStatus.active]: [AccountStatus.suspended, AccountStatus.pending],
    [AccountStatus.suspended]: [AccountStatus.active]
};

export class AccountService {

    constructor(
        private readonly accountRepo: IAccountRepository,
        private readonly userRepo: IUserRepository,
    ) { }

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    async create(dto: CreateAccountDTO) {
        const { user, email, password } = dto;
        const userDoc = await this.userRepo.findById(user);
        if (!userDoc) {
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);
        }
        const hashed = await AccountService.prepareHash(password);
        try {
            const created = await this.accountRepo.create({
                ...dto, email, password: hashed, status: AccountStatus.pending
            });
            return { ...created, user: userDoc };
        } catch (err: any) {
            // 5. Handle unique index violations
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.ACCOUNT_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async exists(filter: FilterAccountDTO) {
        return await this.accountRepo.exists(filter);
    }

    async getAll() {
        const users = await this.accountRepo.findAll();
        return users;
    }

    async update(dto: UpdateAccountDTO) {
        const { id, data, userId } = dto;
        if (data.password) {
            const hashed = await AccountService.prepareHash(data.password);
            data.password = hashed;
        }
        const updated = await this.accountRepo.update(id, data);
        if (!updated) throw new Error(ERROR_CODES.UNAUTHORIZED);
        return updated;
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const user = await this.accountRepo.findById(id);
        if (!user) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }
        const from = user.status as AccountStatus;
        const to = next as AccountStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            Account_TRANSITIONS
        );
        return await this.accountRepo.update(id, {
            status: to
        });
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const userDoc = await this.accountRepo.findById(id);
        if (!userDoc) throw new AppError(ERROR_CODES.UNAUTHORIZED);
        if (userDoc.status === AccountStatus.active) {
            throw new Error(ERROR_CODES.ACCOUNT_IN_USE);
        }
        return await this.accountRepo.delete(id);
    }
}
