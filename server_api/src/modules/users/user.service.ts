import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { DeleteDto } from "../../util/delete.dto";
import { Role } from "./roles/role.model";
import JwtPayload, { ChangePasswordDTO, CreateUserDTO, LoginDto, UpdateUserDTO } from "./user.dto";
import { UserStatus } from "./user.enum";
import { IUserRepository, UserRepository } from "./user.repository";
import { UserStateMachine } from "./user.state-machine";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { CacheService } from "../../util/cache/cache.service";


export class UserService {

    private repository: IUserRepository;
    private appRepository: IApplicantRepository;

    constructor(repository?: IUserRepository, appRepository?: IApplicantRepository) {
        this.repository = repository || new UserRepository();
        this.appRepository = appRepository || new ApplicantRepository();
    }

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    async create(data: CreateUserDTO) {
        const applicantDoc = await this.appRepository.find({ email: data.email });
        if (!applicantDoc) {
            throw Error("Applicant Not Found!");
        }
        const hashed = await UserService.prepareHash(data.password);
        const dto = {
            ...data,
            applicant: String(applicantDoc._id),
            password: hashed,
            status: UserStatus.pending
        };
        const createdUser = await this.repository.create(dto);
        const { password, ...rest } = createdUser;
        return { ...rest, applicant: applicantDoc };
    }

    async getUsers() {
        const users = await this.repository.findAll();
        return users.map(({ password, ...rest }) => rest);
    }

    async update(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error("User not found");
        if (data.password) {
            const hashed = await UserService.prepareHash(data.password);
            data.password = hashed;
        }
        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error("User not found.");
        const { password, ...rest } = updated;
        return rest;
    }


    async changeStatus(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error("User not found");

        const nextState = data.status;
        if (!nextState) throw new Error("Status is required");
        const current = userDoc.status;

        // --- State Machine Validation ---
        UserStateMachine.validateTransition(current, nextState);

        const updated = await this.repository.update(dto.id, dto.data);
        const { password, ...rest } = updated;
        return rest;
    }

    async login(dto: LoginDto) {
        const { email, password } = dto;
        const userDoc = await this.repository.findByEmail(email);
        if (!userDoc || userDoc.status !== UserStatus.active) {
            throw new Error("User not found");
        }
        const isMatch = await bcrypt.compare(password, userDoc.password);
        if (!isMatch) {
            throw new Error("Invalid credentials.");
        }
        const userId = String(userDoc._id);
        const applicantId = String(userDoc.applicant);


        const applicantDoc = await this.appRepository.find({ id: applicantId });
        if (!applicantDoc) {
            throw new Error("Applicant not found.");
        }
        const permissions = applicantDoc.roles?.flatMap((role: any) =>
            role.permissions?.map((p: any) => p.name)
        ) || [];

        const ownerships = applicantDoc.ownerships?.map((org: any) => org._id) || []

        CacheService.setUserPermissions(userId, permissions);
        //CacheService.setUserOrganizations(userId, ownerships);


        const payload: JwtPayload = {
            _id: userId,
            applicantId,
            email,
            status: userDoc.status
        };

        const token = jwt.sign(payload, process.env.KEY as string, { expiresIn: '2h' });
        const response = {
            ...payload,
            permissions: permissions,
            organizations: applicantDoc.ownerships || [],
            applicant: applicantDoc
        };

        await this.repository.update(userId, { lastLogin: new Date() });

        return { token, user: response };
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error("User not found");

        if (userDoc.status === UserStatus.deleted) {
            return await this.repository.delete(id);
        }
        //soft deletion
        const deleted = await this.changeStatus({ id, data: { status: UserStatus.deleted }, userId });
        if (!deleted) throw new Error("User not found");
        return deleted;
    }


    /*
    async reset(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error("User not found");
        if (!data.password) throw new Error("Password not found");
        const hashed = await UserService.prepareHash(data.password);
        const resetted = await this.repository.update(id, { password: hashed });
        return resetted;
    }
        */

    async changePassword(dto: ChangePasswordDTO) {
        const { id, data, userId } = dto;
        const { currentPassword, password: newPassword } = data;

        const user = await this.repository.findById(id);
        if (!user) throw new Error("User not found");
        //check here the current user(auth)
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new Error("Current password is incorrect");

        const hashed = await UserService.prepareHash(newPassword);
        const changed = await this.repository.update(id, { password: hashed });

        const { password, ...rest } = changed;
        return rest;
    }







    /*
        static async deleteUser(id: string) {
            const user = await User.findById(id).select("-password");
            if (!user) throw new Error("User not found");
    
            if (user.status === UserStatus.deleted) {
                const applicant = await Applicant.findOne({ user: id });
                if (applicant) {
                    throw new Error("Cannot delete user linked to an applicant");
                }
                await user.deleteOne();
                return { message: "User permanently deleted" };
            }
    
            user.status = UserStatus.deleted;
            await user.save();
            return { message: "User marked as deleted successfully" };
        }
    */

    /*
static async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await User.findById(id);
    if (!user) throw new Error("User not found");

    const { oldPassword, newPassword } = dto;

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new Error("Old password is incorrect");
    }
    user.password = await this.prepareHash(newPassword);
    await user.save();

    return { message: "Password changed successfully" };
}
*/

    /*
        static async resetPassword(id: string, newPassword: string) {
            const user = await User.findById(id);
            if (!user) throw new Error("User not found");
    
            user.password = await this.prepareHash(newPassword);
            await user.save();
    
            return { message: "Password reset successfully" };
        }
    */

    static async initAdminUser() {
        const repository = new UserRepository();
        const email = process.env.EMAIL;
        const password = process.env.PASSWORD;
        if (!email || !password) {
            throw new Error('Default Admin credentials are not found in environment variables.');
        }
        const exist = await repository.findByEmail(email);
        if (!exist) {
            const adminRole = await Role.findOne({ role_name: "admin" });
            if (!adminRole) {
                throw new Error("Admin role not initialized.");
            }
            const hashed = await this.prepareHash(password);
            const data = { email: email, password: hashed, status: UserStatus.active, roles: [adminRole._id as string] };
            await repository.create(data);
            console.log('Default admin user created successfully.');
        }
    }
}
