/* eslint-disable @next/next/no-img-element */
import { OrganizationalUnit } from '@/app/(main)/organizations/models/organization.model';
import { AppMenuItem } from '@/types';
import Link from 'next/link';
import { PrimeIcons } from 'primereact/api';
import { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
//import { Scope } from '@/app/(main)/applicants/models/applicant.model';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';


const AppMenu = () => {
    const { hasPermission, hasOrganizationType } = useAuth();
    const { layoutConfig } = useContext(LayoutContext);
    //const icons = ['pi pi-mars', 'pi pi-microchip', 'pi pi-prime', 'pi pi-sparkles', 'pi pi-venus'];   

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Directorate',
            icon: PrimeIcons.SITEMAP,
            visible: hasOrganizationType([OrganizationalUnit.Directorate]),
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: '/calls',
                    visible: hasPermission([
                        PERMISSIONS.CALL.CREATE,
                        PERMISSIONS.CALL.UPDATE,
                        PERMISSIONS.CALL.DELETE
                    ])
                },
                {
                    label: 'Themes',
                    icon: 'pi pi-fw pi-tags',
                    to: '/themes',
                    visible: hasPermission(
                        [
                            PERMISSIONS.THEME.CREATE,
                            PERMISSIONS.THEME.UPDATE,
                            PERMISSIONS.THEME.DELETE
                        ]
                    )
                },
                {
                    label: 'Evaluations',
                    icon: 'pi pi-fw pi-calculator',
                    to: '/evaluations',
                    visible: hasPermission(
                        [
                            PERMISSIONS.EVALUATION.CREATE,
                            PERMISSIONS.EVALUATION.UPDATE,
                            PERMISSIONS.EVALUATION.DELETE
                        ]
                    )
                },
                {
                    label: 'Grants',
                    icon: 'pi pi-fw pi-wrench',
                    to: '/grants',
                    visible: hasPermission(
                        [
                            PERMISSIONS.GRANT.CREATE,
                            PERMISSIONS.GRANT.UPDATE,
                            PERMISSIONS.GRANT.DELETE
                        ]
                    )
                },
                {
                    label: 'Projects',
                    icon: PrimeIcons.BRIEFCASE,
                    to: '/projects'
                },
            ]
        },
        {
            label: 'Manage',
            items: [

                {
                    label: 'Calendars',
                    icon: PrimeIcons.CALENDAR,
                    to: '/calendars',
                    visible: hasPermission(
                        [
                            PERMISSIONS.CALENDAR.CREATE,
                            PERMISSIONS.CALENDAR.UPDATE,
                            PERMISSIONS.CALENDAR.DELETE
                        ]
                    )
                },
                {
                    label: 'Applicants',
                    icon: PrimeIcons.GLOBE,
                    visible: hasPermission(
                        [
                            PERMISSIONS.APPLICANT.CREATE,
                            PERMISSIONS.APPLICANT.UPDATE,
                            PERMISSIONS.APPLICANT.DELETE
                        ]
                    ),
                    to: '/applicants',
                },
                {
                    label: 'Organizations',
                    icon: 'pi pi-sitemap',
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.CREATE,
                            PERMISSIONS.ORGANIAZTION.UPDATE,
                            PERMISSIONS.ORGANIAZTION.DELETE
                        ]
                    ),
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
                    label: 'Positions',
                    icon: 'pi pi-fw pi-flag',
                    to: '/applicants/positions',
                    visible: hasPermission([
                        PERMISSIONS.POSITION.CREATE,
                        PERMISSIONS.POSITION.UPDATE,
                        PERMISSIONS.POSITION.DELETE
                    ])
                },
                {
                    label: 'User Accounts',
                    icon: PrimeIcons.USERS,
                    to: '/users',
                    visible: hasPermission(
                        [
                            PERMISSIONS.USER.CREATE,
                            PERMISSIONS.USER.UPDATE,
                            PERMISSIONS.USER.DELETE
                        ]
                    )
                },
                {
                    label: 'Roles &  Permissions',
                    icon: PrimeIcons.LOCK,
                    to: '/roles',
                    visible: hasPermission(
                        [
                            PERMISSIONS.ROLE.CREATE,
                            PERMISSIONS.ROLE.UPDATE,
                            PERMISSIONS.ROLE.DELETE
                        ]
                    )
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
