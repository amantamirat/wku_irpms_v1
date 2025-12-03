import bcrypt from "bcryptjs";
import { DeleteDto } from "../../util/delete.dto";
import { Role } from "./roles/role.model";
import { ChangePasswordDTO, CreateUserDTO, UpdateUserDTO } from "./user.dto";
import { UserStatus } from "./user.enum";
import { IUserRepository, UserRepository } from "./user.repository";
import { UserStateMachine } from "./user.state-machine";


export class UserService {

    private repository: IUserRepository;

    constructor(repository?: IUserRepository) {
        this.repository = repository || new UserRepository();
    }

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    async create(data: CreateUserDTO) {
        const hashed = await UserService.prepareHash(data.password);
        // Build the proper DTO for the repository
        const dto = {
            ...data,
            password: hashed,
            status: UserStatus.pending
        };
        const createdUser = await this.repository.create(dto);
        // Remove password before returning
        const { password, ...rest } = createdUser;
        return rest;
    }

    async getUsers() {
        const users = await this.repository.findAll();
        return users.map(({ password, ...rest }) => rest);
    }

    async update(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;

        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error("User not found");

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
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;

        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error("User not found");

        if (userDoc.status === UserStatus.deleted) {
            //hard deletion
            if (String(userDoc.createdBy) !== userId) {
                throw new Error("You can not delete this user!");
            }
            return await this.repository.delete(id);
        }
        //soft deletion
        const deleted = await this.changeStatus({ id, data: { status: UserStatus.deleted }, userId });
        if (!deleted) throw new Error("User not found");
        return deleted;
    }
    ////

    async reset(dto: UpdateUserDTO) {
        const { id, data, userId } = dto;
        const userDoc = await this.repository.findById(id);
        if (!userDoc) throw new Error("User not found");
        if (!data.password) throw new Error("Password not found");
        const hashed = await UserService.prepareHash(data.password);
        const resetted = await this.repository.update(id, { password: hashed });
        return resetted;
    }

    async changePassword(dto: ChangePasswordDTO) {
        const { id, data, userId } = dto;
        const { oldPassword, newPassword } = data;

        const user = await this.repository.findById(id);
        if (!user) throw new Error("User not found");


        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) throw new Error("Old password is incorrect");

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
        const userName = process.env.ADMIN_USER_NAME;
        const email = process.env.SYS_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!userName || !email || !password) {
            throw new Error('Default Admin credentials are not found in environment variables.');
        }
        const exist = await repository.findByName(userName);
        if (!exist) {
            const adminRole = await Role.findOne({ role_name: "admin" });
            if (!adminRole) {
                throw new Error("Admin role not initialized.");
            }
            const hashed = await this.prepareHash(password);
            const data = { user_name: userName, password: hashed, email: email, status: UserStatus.active, roles: [adminRole._id as string] };
            await repository.create(data);
            console.log('Default admin user created successfully.');
        }
    }
}
