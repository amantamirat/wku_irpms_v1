/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';
import { PrimeIcons } from 'primereact/api';
import { Organization, OrganizationalUnit } from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { Scope } from '@/app/(main)/applicants/models/applicant.model';
import { useAuth } from '@/contexts/auth-context';


const AppMenu = () => {
    const { hasPermission } = useAuth();
    const { layoutConfig } = useContext(LayoutContext);
    const icons = ['pi pi-mars', 'pi pi-microchip', 'pi pi-prime', 'pi pi-sparkles', 'pi pi-venus'];

    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {
        OrganizationApi.getOrganizations({ type: OrganizationalUnit.Directorate })
            .then(data => setOrganizations(data))
            .catch(err => console.error('Failed to fetch organization of directorates', err));
    }, []);

    const directoratesMenu: AppMenuItem = {
        label: 'Directorates',
        icon: 'pi pi-sitemap',
        items: organizations.map((dir, index) => ({
            label: dir.name,
            icon: icons[index % icons.length],
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: `/calls?id=${dir._id}&name=${encodeURIComponent(dir.name)}`
                },

                {
                    label: 'Grants',
                    icon: 'pi pi-fw pi-wrench',
                    to: `/grants?id=${dir._id}&name=${encodeURIComponent(dir.name)}`
                },

                {
                    label: 'Themes',
                    icon: 'pi pi-fw pi-tags',
                    to: `/themes?id=${dir._id}&name=${encodeURIComponent(dir.name)}`

                },
                {
                    label: 'Evaluations',
                    icon: 'pi pi-fw pi-calculator',
                    to: `/evals?id=${dir._id}&name=${encodeURIComponent(dir.name)}`
                },
            ]
        }))
    };



    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        //directoratesMenu,
        {
            label: 'Manage',
            items: [
                {
                    label: 'Projects',
                    icon: PrimeIcons.BRIEFCASE,
                    to: '/projects'
                },
                {
                    label: 'Calendars',
                    icon: PrimeIcons.CALENDAR,
                    to: '/calendars'
                },
                {
                    label: 'Applicants',
                    icon: PrimeIcons.GLOBE,
                    items: [
                        {
                            label: 'Academic',
                            icon: 'pi pi-fw pi-crown',
                            to: `/applicants?scope=${Scope.academic}`
                        },
                        {
                            label: 'Supportive',
                            icon: 'pi pi-fw pi-bullseye',
                            to: `/applicants?scope=${Scope.supportive}`
                        },
                        {
                            label: 'External',
                            icon: 'pi pi-fw pi-asterisk',
                            to: `/applicants?scope=${Scope.external}`
                        },
                        {
                            label: 'Positions',
                            icon: 'pi pi-fw pi-flag',
                            to: '/applicants/positions'
                        },
                    ]
                },
                {
                    label: 'Organizations',
                    icon: 'pi pi-sitemap',
                    items: [
                        {
                            label: 'Colleges',
                            icon: 'pi pi-fw pi-warehouse',
                            to: `/organizations?type=${OrganizationalUnit.College}`
                        },
                        {
                            label: 'Directorates',
                            icon: 'pi pi-fw pi-objects-column',
                            to: `/organizations?type=${OrganizationalUnit.Directorate}`
                        },
                        {
                            label: 'Offices',
                            icon: 'pi pi-fw pi-shop',
                            to: `/organizations?type=${OrganizationalUnit.Supportive}`
                        },
                        {
                            label: 'Sectors',
                            icon: 'pi pi-fw pi-building-columns',
                            to: `/organizations?type=${OrganizationalUnit.Sector}`
                        },
                        {
                            label: 'Specializations',
                            icon: PrimeIcons.FILTER,
                            to: `/organizations?type=${OrganizationalUnit.Specialization}`
                        }
                    ]
                },

                {
                    label: 'User Accounts',
                    icon: PrimeIcons.USERS,
                    to: '/users',
                    visible: hasPermission(['user:read'])
                },
                {
                    label: 'Roles &  Permissions',
                    icon: PrimeIcons.LOCK,
                    to: '/roles',
                    visible: hasPermission(['role:read', 'role:create', 'role:update', 'role:delete'])
                }
            ]
        },
        {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            to: '/pages',
            items: [
                {
                    label: 'Landing',
                    icon: 'pi pi-fw pi-globe',
                    to: '/landing'
                }
            ]
        },
        {
            label: 'Get Started',
            items: [
                {
                    label: 'Documentation',
                    icon: 'pi pi-fw pi-question',
                    to: '/documentation'
                }
            ]
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

                <Link href="https://www.wku.edu.et" target="_blank" style={{ cursor: 'pointer' }}>
                    <img alt="Wolkite University" className="w-full mt-3" src={`/images/wku-plan-${layoutConfig.colorScheme === 'light' ? '2' : '1'}.jpg`} />
                </Link>
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
