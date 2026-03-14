import bcrypt from "bcryptjs";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";
import { IUserRepository, UserRepository } from "./user.repository";
import { USER_TRANSITIONS, UserStatus } from "./user.state-machine";


export class UserService {

    constructor(
        private readonly repository: IUserRepository = new UserRepository(),
        private readonly appRepository: IApplicantRepository = new ApplicantRepository(),
    ) { }

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    async create(dto: CreateUserDTO) {
        const { applicant, email, password } = dto;
        const applicantDoc = await this.appRepository.findById(applicant);
        if (!applicantDoc) {
            throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);
        }
        const hashed = await UserService.prepareHash(password);
        try {
            const created = await this.repository.create({
                ...dto, email, password: hashed, status: UserStatus.pending
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

    async getUsers() {
        const users = await this.repository.findAll();
        return users;
    }

    async update(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;
        if (data.password) {
            const hashed = await UserService.prepareHash(data.password);
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
        const from = user.status as UserStatus;
        const to = next as UserStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            USER_TRANSITIONS
        );
        return await this.repository.update(id, {
            status: to
        });
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new AppError(ERROR_CODES.UNAUTHORIZED);
        if (userDoc.status === UserStatus.active) {
            throw new Error(ERROR_CODES.ACCOUNT_IN_USE);
        }
        return await this.repository.delete(id);
    }
}
