import fs from 'fs/promises';
import path from 'path';

import { prepareHash } from './userService';
import { User } from '../modules/users/user.model';
import { UserStatus } from '../modules/users/enums/status.enum';
import { Permission } from '../modules/users/permissions/permission.model';
import { Role } from '../modules/users/roles/role.model';





export const initRoles = async () => {
    const allPermissions = await Permission.find({});

    const adminPermissions = allPermissions.filter(p =>
        p.name.startsWith('user:') ||
        p.name.startsWith('role:') ||
        p.name === 'permission:read'
    );

    const adminRoleExists = await Role.findOne({ role_name: 'Administrator' });
    if (!adminRoleExists) {
        await new Role({
            role_name: 'Administrator',
            permissions: adminPermissions.map(p => p._id)
        }).save();
        console.log('Administrator role created with user, role, and permission:read permissions');
    } else {
        console.log('Administrator role already exists');
    }
};

export const initAdminUser = async (): Promise<void> => {
    try {
        const userName = process.env.ADMIN_USER_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!userName || !email || !password) {
            throw new Error('Admin credentials are not set in environment variables.');
        }

        const existingAdmin = await User.findOne({ email: email });

        if (!existingAdmin) {
            const adminRole = await Role.findOne({ role_name: 'Administrator' });
            if (!adminRole) {
                throw new Error('Administrator role not found. Please run initRoles first.');
            }
            const hashedPassword = await prepareHash(password);
            const adminUser = new User({
                user_name: userName, email, password: hashedPassword, status: UserStatus.Active, roles: [adminRole]
            });
            await adminUser.save();
            console.log('Admin user created successfully.');

        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
        throw error;
    }
};
