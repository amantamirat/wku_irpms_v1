import { useEffect, useState } from "react";
import { useInterval } from "primereact/hooks";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Call } from "../calls/models/call.model";
import { Stage } from "../calls/stages/models/stage.model";
import ApplyWizard from "./apply/ApplyWizard";

interface StageCardProps {
    stage: Stage;
}

const StageCard = ({ stage }: StageCardProps) => {
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [remainingTime, setRemainingTime] = useState("");
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

    const calculateRemainingTime = () => {
        if (!stage.deadline) return "";
        const now = new Date();
        const deadline = new Date(stage.deadline);
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
            setIsDeadlinePassed(true);
            return "Deadline passed";
        } else {
            setIsDeadlinePassed(false);
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    useInterval(() => {
        setRemainingTime(calculateRemainingTime());
    }, 1000);

    const header = (
        <div className="relative overflow-hidden border-round-top-lg">
            <img
                alt="Call Poster"
                src={"/images/call-card-1.png"}
                className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
            />
        </div>
    );

    const footer = (
        <div className="flex justify-content-between align-items-center mt-3">
            <Button
                label="View"
                icon="pi pi-eye"
                severity="info"
                rounded
                outlined
                onClick={() => setShowViewDialog(true)}
            />
            <Button
                label="Apply"
                icon="pi pi-check-circle"
                severity="success"
                rounded
                outlined
                disabled={isDeadlinePassed} // <-- disable if passed
                onClick={() => setShowApplyDialog(true)}
            />
        </div>
    );

    const truncate = (text: string, max: number) =>
        text.length <= max ? text : text.substring(0, max) + "…";

    return (
        <>
            <Card
                title={<span className="font-semibold text-lg">{truncate(stage.name, 45)}</span>}
                subTitle={
                    <div className="flex flex-column gap-1 text-sm text-600">
                        <span>{(stage.call as Call).title}</span>
                        <span>
                            <strong className={isDeadlinePassed ? 'text-red-500' : 'text-blue-500'}>
                                {stage.deadline ? new Date(stage.deadline).toLocaleDateString(undefined, {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true,
                                }) : ""}
                            </strong>
                        </span>
                        <span className={`font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-blue-500'}`}>
                            {remainingTime && `Time left: ${remainingTime}`}
                        </span>
                    </div>
                }
                header={header}
                footer={footer}
                className="h-full shadow-1 hover:shadow-4 transition-shadow duration-300 border-round-lg overflow-hidden"
            >
                <p className="text-sm text-700 line-height-3">
                    {truncate((stage.call as Call).description || "", 110)}
                </p>
            </Card>
            {(showApplyDialog && stage.call) && (
                <ApplyWizard
                    visible={showApplyDialog}
                    call={stage.call as Call}
                    onCancel={() => setShowApplyDialog(false)}
                />
            )}
        </>
    );
};

export default StageCard;
