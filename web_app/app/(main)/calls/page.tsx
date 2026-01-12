'use client';

import { DirectorateSelector } from "@/components/DirectorateSelector";
import CallManager from "./components/CallManager";
import { useDirectorate } from "@/contexts/DirectorateContext";

const CallPage = () => {

    const { directorate, directorates } = useDirectorate();

    return (
        <>
            <DirectorateSelector />
            <CallManager directorate={directorate} />
        </>

    );
};

export default CallPage;
