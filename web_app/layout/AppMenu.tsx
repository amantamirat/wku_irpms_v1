/* eslint-disable @next/next/no-img-element */
import { OrganizationalUnit } from '@/app/(main)/organizations/models/organization.model';
import { AppMenuItem } from '@/types';
import Link from 'next/link';
import { PrimeIcons } from 'primereact/api';
import { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
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
            label: 'Project',
            items: [
                {
                    label: 'Projects',
                    icon: PrimeIcons.BRIEFCASE,
                    to: '/projects'
                },
                {
                    label: 'Reviewers',
                    icon: 'pi pi-fw pi-eye',
                    to: '/projects/reviewers',
                    //visible: hasPermission([PERMISSIONS.PROJECT.REVIEW])
                },
                {
                    label: 'Collaborators',
                    icon: 'pi pi-fw pi-asterisk',
                    to: '/projects/collaborators',
                },
            ]
        },
        {
            label: 'Directorate',
            visible: hasOrganizationType([OrganizationalUnit.Directorate, OrganizationalUnit.Center]),
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: '/cycles/calls',
                    visible: hasPermission([
                        PERMISSIONS.CYCLE.CALL.CREATE,
                        PERMISSIONS.CYCLE.CALL.UPDATE,
                        PERMISSIONS.CYCLE.CALL.DELETE,

                    ])
                },
                {
                    label: 'Programs',
                    icon: 'pi pi-circle-fill',
                    to: '/cycles/programs',
                    visible: hasPermission([
                        PERMISSIONS.CYCLE.PROGRAM.CREATE,
                        PERMISSIONS.CYCLE.PROGRAM.UPDATE,
                        PERMISSIONS.CYCLE.PROGRAM.DELETE
                    ])
                },
                /** {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: '/calls',
                    visible: hasPermission([
                        PERMISSIONS.CALL.CREATE,
                        PERMISSIONS.CALL.UPDATE,
                        PERMISSIONS.CALL.DELETE
                    ])
                },*/

                {
                    label: 'Evaluations',
                    icon: 'pi pi-chart-bar',
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
                    icon: 'pi pi-cog',
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
                    label: 'Thematic Areas',
                    icon: 'pi pi-fw pi-tags',
                    to: '/thematic_areas',
                    visible: hasPermission(
                        [
                            PERMISSIONS.THEME.CREATE,
                            PERMISSIONS.THEME.UPDATE,
                            PERMISSIONS.THEME.DELETE
                        ]
                    )
                }

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
                    icon: 'pi pi-address-book',
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
                            icon: 'pi pi-fw pi-building-columns',
                            to: `/organizations?type=${OrganizationalUnit.Supportive}`
                        },
                        {
                            label: 'Sectors',
                            icon: 'pi pi-sitemap',
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
            items: [
                {
                    label: 'Landing',
                    icon: 'pi pi-fw pi-globe',
                    to: '/landing'
                },
                {
                    label: 'University Website',
                    icon: 'pi pi-external-link',
                    to: 'https://www.wku.edu.et',
                    target: '_blank'
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
