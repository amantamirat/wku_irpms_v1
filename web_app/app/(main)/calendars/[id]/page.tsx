'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar } from "../models/calendar.model";
import { CalendarApi } from "../api/calendar.api";
import CalendarDetail from "../components/CalendarDetail";

export default function CalendarDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const data = await CalendarApi.getById!(id);
                setCalendar(data);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCalendar();
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (!calendar) return <p>Calendar not found</p>;

    return (
        <div className="p-4">
            <h2 className="mb-3">
                Calendar {calendar.year}
            </h2>
            <CalendarDetail calendar={calendar} />
        </div>
    );
}
