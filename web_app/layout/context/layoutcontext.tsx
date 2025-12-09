'use client';
import React, { useState, createContext, useEffect } from 'react';
import { LayoutState, ChildContainerProps, LayoutConfig, LayoutContextProps } from '@/types';
export const LayoutContext = createContext({} as LayoutContextProps);

export const LayoutProvider = ({ children }: ChildContainerProps) => {
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'light',
        theme: 'lara-light-indigo',
        scale: 14
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    });

    // 👇 OS Theme detection and application
    useEffect(() => {
        const link = document.getElementById("theme-css") as HTMLLinkElement;

        const applyTheme = () => {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

            const newTheme = isDark ? 'lara-dark-indigo' : 'lara-light-indigo';
            const newColorScheme = isDark ? 'dark' : 'light';

            // Update Sakai layoutConfig state
            setLayoutConfig((prev) => ({ ...prev, theme: newTheme, colorScheme: newColorScheme }));

            // Update the <link> CSS file
            if (link) link.href = `/themes/${newTheme}/theme.css`;
        };

        // Apply theme initially
        applyTheme();

        // Listen for OS theme changes
        const watcher = window.matchMedia("(prefers-color-scheme: dark)");
        watcher.addEventListener("change", applyTheme);

        return () => watcher.removeEventListener("change", applyTheme);
    }, []);
    // the os theme detector ends here 
    
    
    const onMenuToggle = () => {
        if (isOverlay()) {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, overlayMenuActive: !prevLayoutState.overlayMenuActive }));
        }

        if (isDesktop()) {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, staticMenuDesktopInactive: !prevLayoutState.staticMenuDesktopInactive }));
        } else {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive }));
        }
    };

    const showProfileSidebar = () => {
        setLayoutState((prevLayoutState) => ({ ...prevLayoutState, profileSidebarVisible: !prevLayoutState.profileSidebarVisible }));
    };

    const isOverlay = () => {
        return layoutConfig.menuMode === 'overlay';
    };

    const isDesktop = () => {
        return window.innerWidth > 991;
    };

    const value: LayoutContextProps = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        showProfileSidebar
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
