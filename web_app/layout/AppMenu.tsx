/* eslint-disable @next/next/no-img-element */
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
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
    const { hasPermission } = useAuth();
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Directorate',
            visible: hasPermission([
                PERMISSIONS.CALL.CREATE,
                PERMISSIONS.EVALUATION.CREATE,
                PERMISSIONS.THEMATIC.CREATE,
            ]),
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: '/calls',
                    visible: hasPermission([
                        PERMISSIONS.CALL.CREATE,
                    ])
                },
                {
                    label: 'Evaluations',
                    icon: 'pi pi-chart-bar',
                    to: '/evaluations',
                    visible: hasPermission(
                        [
                            PERMISSIONS.EVALUATION.CREATE,
                        ]
                    )
                },
                {
                    label: 'Thematics',
                    icon: 'pi pi-fw pi-tags',
                    to: '/thematics',
                    visible: hasPermission(
                        [
                            PERMISSIONS.THEMATIC.CREATE
                        ]
                    )
                }
            ]
        },
        {
            label: 'Manage',
            visible: hasPermission(
                [
                    PERMISSIONS.CALENDAR.CREATE,
                    PERMISSIONS.PROJECT.CREATE,
                    PERMISSIONS.GRANT.CREATE,
                ]
            ),
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
                    label: 'Grants',
                    icon: 'pi pi-bitcoin',
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
                    to: '/projects/workspace',
                    visible: hasPermission(
                        [
                            PERMISSIONS.PROJECT.CREATE
                        ]
                    )
                },

            ]
        },
        {
            label: 'Organizations',
            visible: hasPermission(
                [
                    PERMISSIONS.ORGANIAZTION.COLLEGE.CREATE,
                    PERMISSIONS.ORGANIAZTION.DEPARTMENT.CREATE,
                    PERMISSIONS.ORGANIAZTION.PROGRAM.CREATE,
                    PERMISSIONS.ORGANIAZTION.DIRECTORATE.CREATE,
                    PERMISSIONS.ORGANIAZTION.CENTER.CREATE,
                    PERMISSIONS.ORGANIAZTION.EXTERNAL.CREATE,
                ]
            ),
            items: [
                {
                    label: 'Colleges',
                    icon: 'pi pi-fw pi-warehouse',
                    to: `/organizations?type=${OrgnUnit.College}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.COLLEGE.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Departments',
                    icon: 'pi pi-fw pi-star',
                    to: `/organizations?type=${OrgnUnit.Department}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.DEPARTMENT.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Programs',
                    icon: 'pi pi-fw pi-star-half',
                    to: `/organizations?type=${OrgnUnit.Program}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.PROGRAM.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Directorates',
                    icon: 'pi pi-fw pi-objects-column',
                    to: `/organizations?type=${OrgnUnit.Directorate}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.DIRECTORATE.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Centers',
                    icon: 'pi pi-fw pi-circle',
                    to: `/organizations?type=${OrgnUnit.Center}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.CENTER.CREATE,
                        ]
                    ),
                },
                {
                    label: 'External',
                    icon: "pi pi-fw pi-mars",
                    to: `/organizations?type=${OrgnUnit.External}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.EXTERNAL.CREATE,
                        ]
                    ),
                }

            ]
        },
        {
            label: 'Account',
            visible: hasPermission(
                [
                    PERMISSIONS.USER.CREATE,
                    PERMISSIONS.ROLE.CREATE,
                    PERMISSIONS.APPLICANT.CREATE
                ]
            ),
            items: [
                {
                    label: 'Applicants',
                    icon: PrimeIcons.USERS,
                    visible: hasPermission(
                        [
                            PERMISSIONS.APPLICANT.CREATE,
                        ]
                    ),
                    to: '/applicants',
                },
                {
                    label: 'Credentials',
                    icon: PrimeIcons.SHIELD,
                    to: '/users',
                    visible: hasPermission(
                        [
                            PERMISSIONS.USER.CREATE,
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
                        ]
                    )
                }
            ]
        },
        {
            label: 'Miscellaneous',
            visible: hasPermission([
                PERMISSIONS.STUDENT.CREATE,
                PERMISSIONS.SPECIALIZATION.CREATE,
                PERMISSIONS.POSITION.CREATE
            ]),
            items: [
                {
                    label: 'Students',
                    icon: PrimeIcons.BOOK,
                    visible: hasPermission(
                        [
                            PERMISSIONS.STUDENT.READ,
                        ]
                    ),
                    to: '/applicants/students',
                },
                {
                    label: 'Specializations',
                    icon: 'pi pi-fw pi-filter-fill',
                    to: '/specializations',
                    visible: hasPermission([
                        PERMISSIONS.SPECIALIZATION.CREATE,
                        PERMISSIONS.SPECIALIZATION.UPDATE,
                        PERMISSIONS.SPECIALIZATION.DELETE
                    ])
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
            ]
        },
        {
            label: 'Reports',
            items: [
                {
                    label: 'Overview',
                    icon: 'pi pi-circle-on',
                    to: '/reports/overview'
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
