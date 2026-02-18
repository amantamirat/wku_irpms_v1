'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';


export default function QuickLinks() {
    const { hasPermission } = useAuth();

    // Configure links with permission requirements
    const links = useMemo(() => [
        {
            href: '/projects',
            label: 'My Projects',
            icon: 'pi pi-briefcase',
            permission: PERMISSIONS.PROJECT.READ,
            buttonClass: 'p-button-success'
        },
        {
            href: '/calls/reviewers',
            label: 'My Evaluations',
            icon: 'pi pi-chart-bar',
            permission: PERMISSIONS.REVIEWER.READ,
            buttonClass: 'p-button-warning'
        },
        {
            href: '/projects/collaborators',
            label: 'My Collaborations',
            icon: 'pi pi-users',
            permission: PERMISSIONS.COLLABORATOR.READ,
            buttonClass: 'p-button-help'
        }
    ], []);

    // Filter links by permissions
    const allowedLinks = links.filter(link => hasPermission([link.permission]));

    return (
        <div className="card flex flex-wrap gap-3 justify-content-center">
            {allowedLinks.map((link, index) => (
                <Link key={index} href={link.href}>
                    <Button
                        label={link.label}
                        icon={link.icon}
                        className={`${link.buttonClass} p-button-rounded`}
                    />
                </Link>
            ))}
        </div>
    );
}
