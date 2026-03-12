import bcrypt from "bcryptjs";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";
import { IUser } from "./user.model";
import { IUserRepository, UserRepository } from "./user.repository";
import { UserStateMachine } from "./user.state-machine";
import { UserStatus } from "./user.status";

export class UserService {

    constructor(
        private readonly repository: IUserRepository = new UserRepository(),
        private readonly appRepository: IApplicantRepository = new ApplicantRepository(),
    ) { }

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    removePassword(user: Partial<IUser>) {
        const { password, ...rest } = user;
        return rest;
    }

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
            const user = this.removePassword(created);
            return { ...user, applicant: applicantDoc };
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
        return users.map((u) => this.removePassword(u));
    }

    async update(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;
        if (data.password) {
            const hashed = await UserService.prepareHash(data.password);
            data.password = hashed;
        }
        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error(ERROR_CODES.USER_NOT_FOUND);
        return this.removePassword(updated);
    }

    async updateStatus(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error(ERROR_CODES.USER_NOT_FOUND);

        const nextState = data.status;
        if (!nextState) throw new Error("Status is required");
        const current = userDoc.status;
        // --- State Machine Validation ---
        UserStateMachine.validateTransition(current, nextState);
        const updated = await this.repository.update(dto.id, dto.data);
        if (!updated) {
            throw new Error("User not found");
        }
        return this.removePassword(updated);
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new AppError(ERROR_CODES.USER_NOT_FOUND);
        if (userDoc.status === UserStatus.active) {
            throw new Error("ACTIVE_USER_FOUND");
        }
        return await this.repository.delete(id);
    }



}
