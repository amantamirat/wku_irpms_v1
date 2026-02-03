'use client';

import { useDirectorate } from "@/contexts/DirectorateContext";
import ThematicManager from "./components/ThematicManager";
import { DirectorateSelector } from "@/components/DirectorateSelector";


const ThematicPage = () => {
    const { directorate, directorates } = useDirectorate();

    return (
        <>
            <DirectorateSelector />
            <ThematicManager directorate={directorate} />
        </>

    );
};

export default ThematicPage;
