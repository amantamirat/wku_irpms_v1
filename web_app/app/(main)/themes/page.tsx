'use client';


import ThemeManager from './components/ThemeManager';
import { ThemeType } from './models/theme.model';

const ThemePage = () => {
    return (
        <ThemeManager type={ThemeType.thematic_area} />
    );
};

export default ThemePage;
