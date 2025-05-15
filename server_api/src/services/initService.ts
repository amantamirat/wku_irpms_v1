import fs from 'fs/promises';
import path from 'path';
import { Permission } from "../models/permission.model";
import { Role } from '../models/role.model';
import { User } from '../models/user';
import { createUserAccount } from './userService';


export const initPermissions = async () => {
    const filePath = path.join(process.cwd(), 'data', 'permissions.json');
    const rawData = await fs.readFile(filePath, 'utf-8');
    const permissions = JSON.parse(rawData);
    for (const perm of permissions) {
        const exists = await Permission.findOne({ name: perm.name });
        if (!exists) {
            await new Permission(perm).save();
        }
    }
    console.log('Permissions seeded from JSON');
};


export const initRoles = async () => {
    const allPermissions = await Permission.find({});

    const adminPermissions = allPermissions.filter(p =>
        p.name.startsWith('user:') ||
        p.name.startsWith('role:') ||
        p.name === 'permission:read'
    );

    const adminRoleExists = await Role.findOne({ name: 'Administrator' });
    if (!adminRoleExists) {
        await new Role({
            name: 'Administrator',
            permissions: adminPermissions.map(p => p._id)
        }).save();
        console.log('Administrator role created with user, role, and permission:read permissions');
    } else {
        console.log('ℹAdministrator role already exists');
    }
};

export const initUser = async (): Promise<void> => {
    try {
        const userName = process.env.ADMIN_USER_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!userName || !email || !password) {
            throw new Error('Admin credentials are not set in environment variables.');
        }

        const existingAdmin = await User.exists({ email: email });

        if (!existingAdmin) {
            await createUserAccount({
                user_name: userName,
                email: email,
                password: password,
            });
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
        //throw error;
    }
};
