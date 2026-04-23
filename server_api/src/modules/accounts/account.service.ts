import bcrypt from "bcryptjs";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { IUserRepository, UserRepository } from "../users/user.repository";
import { CreateAccountDTO, UpdateAccountDTO } from "./account.dto";
import { AccountStatus } from "./account.model";
import { IAccountRepository, AccountRepository } from "./account.repository";


export const Account_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
    [AccountStatus.pending]: [AccountStatus.active],
    [AccountStatus.active]: [AccountStatus.suspended, AccountStatus.pending],
    [AccountStatus.suspended]: [AccountStatus.active]
};

export class AccountService {

    constructor(
        private readonly repository: IAccountRepository = new AccountRepository(),
        private readonly appRepository: IUserRepository = new UserRepository()
    ) { }

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    async create(dto: CreateAccountDTO) {
        const { applicant, email, password } = dto;
        const applicantDoc = await this.appRepository.findById(applicant);
        if (!applicantDoc) {
            throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);
        }
        const hashed = await AccountService.prepareHash(password);
        try {
            const created = await this.repository.create({
                ...dto, email, password: hashed, status: AccountStatus.pending
            });
            return { ...created, applicant: applicantDoc };
        } catch (err: any) {
            // 5. Handle unique index violations
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getAll() {
        const users = await this.repository.findAll();
        return users;
    }

    async update(dto: UpdateAccountDTO) {
        const { id, data, userId } = dto;
        if (data.password) {
            const hashed = await AccountService.prepareHash(data.password);
            data.password = hashed;
        }
        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error(ERROR_CODES.UNAUTHORIZED);
        return updated;
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const user = await this.repository.findById(id);
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
        return await this.repository.update(id, {
            status: to
        });
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new AppError(ERROR_CODES.UNAUTHORIZED);
        if (userDoc.status === AccountStatus.active) {
            throw new Error(ERROR_CODES.ACCOUNT_IN_USE);
        }
        return await this.repository.delete(id);
    }
}
