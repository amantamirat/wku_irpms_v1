/* eslint-disable @next/next/no-img-element */
'use client';

import RequireAuth from "@/components/RequireAuth";
import { Call } from "./calls/models/call.model";
import { useEffect, useState } from "react";
import { CallApi } from "./calls/api/call.api";
import { Calendar } from "./calendars/models/calendar.model";



const Dashboard = () => {

    const [calls, setCalls] = useState<Call[]>([]);

    useEffect(() => {
        CallApi.getCalls({})
            .then(data => setCalls(data))
            .catch(err => console.error('Failed to fetch calls of directorates', err));
    }, []);

    return (
        <div className="grid">
            {calls.map((call) => (
                <div key={call._id} className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">
                                    {(call.calendar as Calendar).year}
                                    
                                </span>
                                <div className="text-900 font-medium text-xl">
                                    {call.title}
                                </div>
                            </div>
                            <div
                                className="flex align-items-center justify-content-center bg-blue-100 border-round"
                                style={{ width: "2.5rem", height: "2.5rem" }}
                            >
                                <i className="pi pi-fw pi-megaphone text-blue-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-500 ml-2">Deadline</span>
                        <span className="text-green-500 font-medium ml-2">
                            {new Date(call.deadline).toLocaleDateString()}
                        </span>
                        
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;
