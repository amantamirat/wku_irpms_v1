/* eslint-disable @next/next/no-img-element */
'use client';

import RequireAuth from "@/components/RequireAuth";
import { Call } from "./calls/models/call.model";
import { useEffect, useState } from "react";
import { CallApi } from "./calls/api/call.api";
import { Calendar } from "./calendars/models/calendar.model";
import CallGrid from "./calls/components/CallGrid";



const Dashboard = () => {

    const [calls, setCalls] = useState<Call[]>([]);

    useEffect(() => {
        CallApi.getCalls({})
            .then(data => setCalls(data))
            .catch(err => console.error('Failed to fetch calls of directorates', err));
    }, []);

    return (
        <CallGrid/>
    );
};

export default Dashboard;
