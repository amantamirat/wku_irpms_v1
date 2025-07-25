/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';
import { PrimeIcons } from 'primereact/api';
import { Directorate } from '@/models/directorate';
import { DirectorateService } from '@/services/DirectorateService';
import { Organization, OrganizationType } from '@/models/organization';
import { Scope } from '@/models/applicant';
import { OrganizationService } from '@/services/OrganizationService';


const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const icons = ['pi pi-mars', 'pi pi-microchip', 'pi pi-prime', 'pi pi-sparkles', 'pi pi-venus'];   
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {       
        OrganizationService.getOrganizationsByType(OrganizationType.Directorate)
            .then(data => setOrganizations(data))
            .catch(err => console.error('Failed to fetch organization of directorates', err));
    }, []);    

    const directoratesMenu: AppMenuItem = {
        label: 'Directorates',
        icon: 'pi pi-sitemap',
        items: organizations.map((dir, index) => ({
            label: dir.name,
            icon: icons[index % icons.length],
            //to: `/pages/directorates/${dir._id}`
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',                   
                },
                {
                    label: 'Themes',
                    icon: 'pi pi-fw pi-tags',
                    to: `/pages/themes?directorate=${dir._id}`

                },
                {
                    label: 'Evaluations',
                    icon: 'pi pi-fw pi-calculator',
                },
            ]
        }))
    };

    

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },        
        directoratesMenu,
        {
            label: 'Manage',
            items: [
                {
                    label: 'Calendars',
                    icon: PrimeIcons.CALENDAR,
                    to: '/pages/calendars'
                },
                {
                    label: 'Colleges',
                    icon: 'pi pi-fw pi-warehouse',
                    to: '/pages/colleges'
                },
                {
                    label: 'Departments',
                    icon: 'pi pi-fw pi-shop',
                    to: '/pages/departments'
                },
                {
                    label: 'Specializations',
                    icon: PrimeIcons.FILTER,
                    to: '/pages/specializations'
                },
                {
                    label: 'Applicants',
                    icon: PrimeIcons.GLOBE,
                    items: [
                        {
                            label: 'Academic',
                            icon: 'pi pi-fw pi-crown',
                            to: `/pages/applicants?scope=${Scope.academic}`
                        },
                        {
                            label: 'Supportive',
                            icon: 'pi pi-fw pi-bullseye',
                            to: `/pages/applicants?scope=${Scope.supportive}`
                        },
                        {
                            label: 'External',
                            icon: 'pi pi-fw pi-asterisk',
                            //disabled: true,
                            to: `/pages/applicants?scope=${Scope.external}`
                        }
                    ]
                },

                {
                    label: 'Organizations',
                    icon: 'pi pi-sitemap',
                    items: [
                        {
                            label: 'Colleges',
                            icon: 'pi pi-fw pi-warehouse',
                            to: `/pages/organizations?type=${OrganizationType.College}`
                        },
                        {
                            label: 'Directorates',
                            icon: 'pi pi-fw pi-objects-column',
                            to: `/pages/organizations?type=${OrganizationType.Directorate}`
                        },
                        {
                            label: 'Offices',
                            icon: 'pi pi-fw pi-shop',
                            to: `/pages/organizations?type=${OrganizationType.Supportive}`
                        },
                        {
                            label: 'Sectors',
                            icon: 'pi pi-fw pi-building-columns',
                            to: `/pages/organizations?type=${OrganizationType.Sector}`
                        },
                        {
                            label: 'Specialization',
                            icon: PrimeIcons.FILTER,
                            to: `/pages/organizations?type=${OrganizationType.Specialization}`
                        },
                        {
                            label: 'Positions',
                            icon: 'pi pi-fw pi-flag',
                            to: `/pages/organizations?type=${OrganizationType.Position}`
                        },
                    ]
                },
                /*
                 {
                    label: 'Students',
                    icon: 'pi pi-fw pi-graduation-cap',
                },
                */
                /*
                 {
                     label: 'Directorates',
                     icon: 'pi pi-sitemap',
                     to: '/pages/directorates'
                 },
                 */
                {
                    label: 'User Accounts',
                    icon: PrimeIcons.USERS,
                    to: '/pages/users'
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
                },
                {
                    label: 'Figma',
                    url: 'https://www.dropbox.com/scl/fi/bhfwymnk8wu0g5530ceas/sakai-2023.fig?rlkey=u0c8n6xgn44db9t4zkd1brr3l&dl=0',
                    icon: 'pi pi-fw pi-pencil',
                    target: '_blank'
                },
                {
                    label: 'View Source',
                    icon: 'pi pi-fw pi-search',
                    url: 'https://github.com/primefaces/sakai-react',
                    target: '_blank'
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
