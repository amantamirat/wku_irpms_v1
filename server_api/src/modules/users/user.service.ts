import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';
import { DeleteDto } from "../../util/delete.dto";
import { Role } from "./roles/role.model";
import JwtPayload, { ChangePasswordDTO, CreateUserDTO, LoginDto, UpdateUserDTO, VerfyUserDto } from "./user.dto";
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


    async changePassword(dto: ChangePasswordDTO) {
        const { id, data, userId } = dto;
        const { currentPassword, password: newPassword } = data;
        if (id !== userId) {
            throw new Error("You are not authorized to change this password.");
        }
        const user = await this.repository.findById(id);
        if (!user) throw new Error("User not found");

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new Error("Current password is incorrect");

        const hashed = await UserService.prepareHash(newPassword);
        const updated = await this.repository.update(id, { password: hashed });

        const { password, ...rest } = updated;
        return rest;
    }

    async sendCode(email: string): Promise<void> {
        const userDoc = await this.repository.findByEmail(email);
        if (!userDoc || userDoc.status === UserStatus.deleted) {
            throw new Error("User does not exist.");
        }
        const now = new Date();
        const bufferTime = 90 * 60 * 1000; //1 hr and 30 mins
        if (userDoc.resetCode && userDoc.resetCodeExpires && userDoc.resetCodeExpires.getTime() - now.getTime() > bufferTime) {
            return;
        }
        const code = crypto.randomInt(100000000, 999999999).toString(); // 9-digit code
        const expiry = new Date(Date.now() + 120 * 60 * 1000); //120  mins       

        const system_email = process.env.SYS_EMAIL;
        const password = process.env.EMAIL_PASSWORD;
        const transporter: Transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: system_email,
                pass: password,
            },
        });

        const myOptions = {
            from: system_email,
            to: userDoc.email,
            subject: 'Your Verification Code',
            text: `Hello, Welcome! Here is your verification code: ${code}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; color: #333;">
                <h2 style="color: #4CAF50;">Welcome to IRPMS Service!</h2>
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 16px;">Here is your <strong>verification code</strong>:</p>
                <div style="margin: 20px 0; padding: 15px 25px; background-color: #fff; border: 2px dashed #4CAF50; font-size: 24px; font-weight: bold; color: #333; border-radius: 6px; text-align: center;">
                ${code}
                </div>
                <p style="font-size: 14px; color: #666;">If you did not request this, you can safely ignore this email.</p>
                </div>`,
        };

        await new Promise<void>((resolve, reject) => {
            transporter.sendMail(myOptions, (error, info) => {
                if (error) {
                    //console.error("Failed to send email:", error);
                    return reject(error);
                }
                //console.log('Email Sent: ' + info.response);
                resolve();
            });
        });
        const updated = await this.repository.update(String(userDoc._id), { resetCode: code, resetCodeExpires: expiry });
    }

    async resetPassword(data: VerfyUserDto): Promise<void> {
        const { email, resetCode, password } = data;
        if (!password || password.trim() === "") {
            throw new Error("Password not found!");
        }
        const userDoc = await this.repository.findByEmail(email);
        if (!userDoc || userDoc.status === UserStatus.deleted) {
            throw new Error("User does not exist.");
        }
        if (!userDoc.resetCodeExpires || userDoc.resetCodeExpires < new Date()) {
            throw new Error("Verification code has expired. Please request a new one.");
        }
        if (!userDoc.resetCode || userDoc.resetCode !== resetCode) {
            throw new Error("Invalid verification code.");
        }
        const hashed = await UserService.prepareHash(password);
        await this.repository.update(String(userDoc._id), { password: hashed, resetCode: "", resetCodeExpires: new Date() });
    }


    async activateUser(data: VerfyUserDto): Promise<void> {
        const { email, resetCode } = data;
        const userDoc = await this.repository.findByEmail(email);
        if (!userDoc || userDoc.status === UserStatus.deleted) {
            throw new Error("User does not exist.");
        }
        if (!userDoc.resetCodeExpires || userDoc.resetCodeExpires < new Date()) {
            throw new Error("Verification code has expired. Please request a new one.");
        }
        if (!userDoc.resetCode || userDoc.resetCode !== resetCode) {
            throw new Error("Invalid verification code.");
        }
        const current = userDoc.status;
        const nextState = UserStatus.active;
        // --- State Machine Validation ---
        UserStateMachine.validateTransition(current, nextState);
        await this.repository.update(String(userDoc._id), { status: nextState, resetCode: "", resetCodeExpires: new Date() });
    }



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
