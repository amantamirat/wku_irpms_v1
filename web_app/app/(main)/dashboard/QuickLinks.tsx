'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { Ripple } from 'primereact/ripple';

interface QuickLinkItem {
    href: string;
    label: string;
    description: string;
    icon: string;
    permission: string | string[];
    color: string;
}

export default function QuickLinks() {
    const { hasPermission } = useAuth();
    const router = useRouter();

    const links: QuickLinkItem[] = useMemo(() => [
        {
            href: '/dashboard/my-projects/',
            label: 'My Projects',
            description: 'Manage your research, project and deliverables',
            icon: 'pi pi-briefcase',
            permission: PERMISSIONS.PROJECT.LOOKUP,
            color: 'bg-blue-50 text-blue-600 border-blue-200'
        },
        {
            href: '/dashboard/assigned-applications',
            label: 'Assign Reviewers',
            description: 'Assign and manage evaluators for submitted applications',
            icon: 'pi pi-user-plus',
            permission: 'application:assigned:read',
            color: 'bg-teal-50 text-teal-600 border-teal-200'
        },
        {
            href: '/dashboard/my-evaluations',
            label: 'My Evaluations',
            description: 'Evaluate submitted proposals and scores',
            icon: 'pi pi-check-square',
            permission: PERMISSIONS.REVIEWER.LOOKUP,
            color: 'bg-orange-50 text-orange-600 border-orange-200'
        },
        {
            href: '/dashboard/my-memberships',
            label: 'My Memberships',
            description: 'View teams and joint project efforts',
            icon: 'pi pi-users',
            permission: PERMISSIONS.COLLABORATOR.LOOKUP,
            color: 'bg-purple-50 text-purple-600 border-purple-200'
        }
    ], []);

    const allowedLinks = links.filter(link => hasPermission(link.permission));

    if (allowedLinks.length === 0) return null;

    return (
        <div className="col-12 mt-4">
            <div className="flex align-items-center justify-content-between mb-3">
                <h5 className="m-0 font-bold text-900 text-lg">Quick Access</h5>
                <span className="text-sm text-500 font-medium">My tools</span>
            </div>
            <div className="grid">
                {allowedLinks.map((link, index) => (
                    <div key={index} className="col-12 md:col-6 lg:col-3">
                        <div
                            className="p-4 surface-card border-1 surface-border border-round-xl h-full cursor-pointer shadow-sm hover:shadow-md hover:border-primary transition-all transition-duration-200 p-ripple flex flex-column justify-content-between relative overflow-hidden"
                            onClick={() => router.push(link.href)}
                        >
                            <div>
                                <div className="flex align-items-center justify-content-between mb-3">
                                    <div className={`w-3rem h-3rem flex align-items-center justify-content-center border-round-lg ${link.color} border-1`}>
                                        <i className={`${link.icon} text-xl`}></i>
                                    </div>
                                    <i className="pi pi-arrow-right text-400 text-sm"></i>
                                </div>
                                <h6 className="text-900 font-semibold m-0 mb-2 text-base">{link.label}</h6>
                                <p className="text-600 text-xs m-0 line-height-3">
                                    {link.description}
                                </p>
                            </div>
                            <Ripple />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}