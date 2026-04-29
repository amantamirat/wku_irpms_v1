'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useContext, useRef, useState } from 'react';
import Link from 'next/link';

import { StyleClass } from 'primereact/styleclass';
import { Button } from 'primereact/button';
import { Ripple } from 'primereact/ripple';
import { Divider } from 'primereact/divider';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { NodeRef } from '@/types';
import { classNames } from 'primereact/utils';
import { useAuth } from '@/contexts/auth-context';
import { ProgressSpinner } from 'primereact/progressspinner';

const LandingPage = () => {
    const [isHidden, setIsHidden] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const menuRef = useRef<HTMLElement | null>(null);
    const { account: user, loading } = useAuth();

    if (loading) return <div className="flex justify-content-center mt-5"><ProgressSpinner /></div>;

    const toggleMenuItemClick = () => {
        setIsHidden((prevState) => !prevState);
    };

    return (
        <div className="surface-0 flex justify-content-center">
            <div id="home" className="landing-wrapper overflow-hidden">
                {/* Header */}
                <div className="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 flex align-items-center justify-content-between relative lg:static">
                    <Link href="/" className="flex align-items-center">
                        <img src={`/images/wku_logo.png`} alt="WKU Logo" height="50" className="mr-0 lg:mr-2" />
                        <span className="text-900 font-medium text-2xl line-height-3 mr-8">IRPMS</span>
                    </Link>
                    <StyleClass nodeRef={menuRef as NodeRef} selector="@next" enterClassName="hidden" leaveToClassName="hidden" hideOnOutsideClick>
                        <i ref={menuRef} className="pi pi-bars text-4xl cursor-pointer block lg:hidden text-700"></i>
                    </StyleClass>
                    <div className={classNames('align-items-center surface-0 flex-grow-1 justify-content-between hidden lg:flex absolute lg:static w-full left-0 px-6 lg:px-0 z-2', { hidden: isHidden })} style={{ top: '100%' }}>
                        <ul className="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row cursor-pointer">
                            <li>
                                <a href="#home" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                                    <span>Home</span>
                                    <Ripple />
                                </a>
                            </li>
                            <li>
                                <a href="#features" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                                    <span>Features</span>
                                    <Ripple />
                                </a>
                            </li>
                            <li>
                                <a href="#highlights" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                                    <span>Highlights</span>
                                    <Ripple />
                                </a>
                            </li>
                            
                        </ul>
                        <div className="flex justify-content-between lg:block border-top-1 lg:border-top-none surface-border py-3 lg:py-0 mt-3 lg:mt-0">
                            {!user ? (
                                <>
                                    <Link href="/auth/login" passHref>
                                        <Button label="Login" text rounded className="border-none font-light line-height-2 text-blue-500"></Button>
                                    </Link>
                                    <Link href="/auth/register" passHref>
                                        <Button label="Register" rounded className="border-none ml-5 font-light line-height-2 bg-blue-500 text-white"></Button>
                                    </Link>
                                </>
                            ) : (
                                <p>Welcome back, {user.email}!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hero */}
                <div
                    id="hero"
                    className="flex flex-column pt-4 px-4 lg:px-8 overflow-hidden"
                    style={{
                        background: 'linear-gradient(0deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #EEEFAF 0%, #C3E3FA 100%)',
                        clipPath: 'ellipse(150% 87% at 93% 13%)'
                    }}
                >
                    <div className="mx-4 md:mx-8 mt-0 md:mt-4">
                        <h1 className="text-6xl font-bold text-gray-900 line-height-2">
                            <span className="font-light block">Wolkite University</span>
                            Research & Project Management
                        </h1>
                        <p className="font-normal text-2xl line-height-3 md:mt-3 text-gray-700">
                            Streamline research tracking, project approvals, and reporting in one centralized system.
                        </p>
                        <Button type="button" label="Get Started" rounded className="text-xl border-none mt-3 bg-blue-500 font-normal line-height-3 px-3 text-white"></Button>
                    </div>
                    <div className="flex justify-content-center md:justify-content-end">
                        <img src="/images/screen_2.jpg" alt="Hero Image" className="w-9 md:w-auto" />
                    </div>
                </div>

                {/* Features */}
                <div id="features" className="py-4 px-4 lg:px-8 mt-5 mx-0 lg:mx-8">
                    <div className="grid justify-content-center">
                        <div className="col-12 text-center mt-8 mb-4">
                            <h2 className="text-900 font-normal mb-2">Core Features</h2>
                            <span className="text-600 text-2xl">Manage research projects efficiently</span>
                        </div>

                        {/* Feature Cards */}
                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                            <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                <div className="flex align-items-center justify-content-center bg-yellow-200 mb-3" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '10px' }}>
                                    <i className="pi pi-fw pi-users text-2xl text-yellow-700"></i>
                                </div>
                                <h5 className="mb-2 text-900">Project Tracking</h5>
                                <span className="text-600">Monitor project progress and deadlines efficiently.</span>
                            </div>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                            <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                <div className="flex align-items-center justify-content-center bg-cyan-200 mb-3" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '10px' }}>
                                    <i className="pi pi-fw pi-file text-2xl text-cyan-700"></i>
                                </div>
                                <h5 className="mb-2 text-900">Document Management</h5>
                                <span className="text-600">Keep all research papers and reports organized in one place.</span>
                            </div>
                        </div>

                        <div className="col-12 md:col-12 lg:col-4 p-0 lg:pb-5 mt-4 lg:mt-0">
                            <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                                <div className="flex align-items-center justify-content-center bg-indigo-200 mb-3" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '10px' }}>
                                    <i className="pi pi-fw pi-chart-line text-2xl text-indigo-700"></i>
                                </div>
                                <h5 className="mb-2 text-900">Reports & Analytics</h5>
                                <span className="text-600">Generate real-time reports on research and project outcomes.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="py-4 px-4 mx-0 mt-8 lg:mx-8">
                    <div className="grid justify-content-between">
                        <div className="col-12 md:col-2" style={{ marginTop: '-1.5rem' }}>
                            <Link href="/" className="flex flex-wrap align-items-center justify-content-center md:justify-content-start md:mb-0 mb-3 cursor-pointer">
                                <img src={`/images/wku_logo.png`} alt="WKU Logo" width="50" height="50" className="mr-2" />
                                <span className="font-medium text-3xl text-900">IRPMS</span>
                            </Link>
                        </div>

                        <div className="col-12 md:col-10 lg:col-7">
                            <div className="grid text-center md:text-left">
                                <div className="col-12 md:col-3">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-900">University</h4>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">About WKU</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Departments</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Research</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Contact</a>
                                </div>

                                <div className="col-12 md:col-3 mt-4 md:mt-0">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-900">Resources</h4>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Get Started</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Guides</a>
                                    <a className="line-height-3 text-xl block cursor-pointer text-700">FAQs</a>
                                </div>

                                <div className="col-12 md:col-3 mt-4 md:mt-0">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-900">Community</h4>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Workshops</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Events</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Student Portal</a>
                                </div>

                                <div className="col-12 md:col-3 mt-4 md:mt-0">
                                    <h4 className="font-medium text-2xl line-height-3 mb-3 text-900">Legal</h4>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Privacy Policy</a>
                                    <a className="line-height-3 text-xl block cursor-pointer mb-2 text-700">Terms of Service</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;