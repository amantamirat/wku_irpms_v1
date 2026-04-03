'use client';
import { useState, useMemo } from "react";
import { useInterval } from "primereact/hooks";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Call } from "../calls/models/call.model";
import { CallStage } from "../calls/stages/models/call.stage.model";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { GrantStage } from "../grants/stages/models/grant.stage.model";

const StageCard = ({ stage }: { stage: CallStage }) => {
    //const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const { hasPermission } = useAuth();
    const canApply = hasPermission([PERMISSIONS.DOCUMENT.SUBMIT]);

    // Update timer every second
    useInterval(() => setSeconds(prev => prev + 1), 1000);

    const { remainingTime, isDeadlinePassed } = useMemo(() => {
        if (!stage.deadline) return { remainingTime: "", isDeadlinePassed: false };
        const diff = new Date(stage.deadline).getTime() - new Date().getTime();

        if (diff <= 0) return { remainingTime: "Closed", isDeadlinePassed: true };

        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return {
            remainingTime: `${days}d ${hours}h ${mins}m`,
            isDeadlinePassed: false
        };
    }, [stage.deadline, seconds]);

    const header = (
        <div className="relative overflow-hidden" style={{ height: '160px' }}>
            <img
                alt="Grant"
                src="/images/call-card-1.png"
                className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 m-2">
                <Tag
                    severity={isDeadlinePassed ? 'danger' : 'info'}
                    value={isDeadlinePassed ? 'Closed' : remainingTime}
                    icon={isDeadlinePassed ? 'pi pi-lock' : 'pi pi-clock'}
                    className="shadow-2"
                />
            </div>
        </div>
    );

    const footer = (
        <div className="flex gap-2 pt-2 border-top-1 border-100">
            <Button
                label="Apply Now"
                icon="pi pi-send"
                className="flex-grow-1 p-button-sm"
                severity="success"
                disabled={isDeadlinePassed}
            //onClick={() => setShowApplyDialog(true)}
            />
            <Button
                icon="pi pi-info-circle"
                className="p-button-text p-button-secondary p-button-sm"
                tooltip="Details"
            />
        </div>
    );

    return (
        <>
            <Card
                header={header}
                footer={footer}
                className="h-full border-1 border-200 shadow-none hover:shadow-3 transition-all transition-duration-300"
            >
                <div className="flex flex-column gap-2">
                    <div className="text-xs font-bold text-primary uppercase tracking-wider">
                        {(stage.grantStage as GrantStage)?.name}
                    </div>
                    <h6 className="m-0 text-900 line-height-2 font-bold text-lg overflow-hidden white-space-nowrap text-overflow-ellipsis">
                        {(stage.call as Call)?.title}
                    </h6>
                    <p className="text-sm text-600 line-height-3 m-0" style={{ height: '3.6rem', overflow: 'hidden' }}>
                        {(stage.call as Call)?.description}
                    </p>
                </div>
            </Card>

            {                /*
            showApplyDialog && (
                <ApplyWizard
                    visible={showApplyDialog}
                    stage={stage}
                    call={stage.call as Call}
                    onCancel={() => setShowApplyDialog(false)}
                />
            )*/
            }
        </>
    );
};

export default StageCard;