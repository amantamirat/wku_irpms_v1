'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CallStage } from "../models/stage.model";
import { CallStageApi } from "../api/stage.api";
import StageDetail from "../components/StageDetail";


export default function StageDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [stage, setStage] = useState<CallStage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStage = async () => {
            try {
                const data = await CallStageApi.getById!(id);
                setStage(data);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchStage();
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (!stage) return <p>Stage not found</p>;

    return (
        <div className="p-4">
            <h2 className="mb-3">
                Stage {id}
            </h2>
            {
                <StageDetail stage={stage} />
            }
        </div>
    );
}
