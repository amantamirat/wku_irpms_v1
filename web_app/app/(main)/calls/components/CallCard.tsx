import { Dialog } from "primereact/dialog";
import { Call } from "../../calls/models/call.model";
import { FileUpload } from "primereact/fileupload";
import { Card } from "primereact/card";
import { Organization } from "@/models/organization";
import { Calendar } from "../../calendars/models/calendar.model";
import { Button } from "primereact/button";

interface CallCardProps {
    call: Call;

}

export default function CallCard(props: CallCardProps) {

    const { call } = props;


    const header = <img alt="Call" src={call.poster || "/images/callcard.png"} />;

    const footer = (
        <div className="flex justify-content-between align-items-center">
            <div className="flex gap-2">
                <Button label="View" icon="pi pi-eye" severity="info"
                    rounded raised outlined
                />
                <Button
                    label="Apply" icon="pi pi-check-circle" severity="success"
                    rounded raised outlined
                    disabled={new Date(call.deadline) < new Date()}
                />
            </div>
        </div>
    );

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const getDeadlineStatus = (): { severity: SeverityType; text: string } => {
        const today = new Date();
        const deadlineDate = new Date(call.deadline);
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { severity: "danger", text: "Expired" };
        if (diffDays <= 7) return { severity: "warning", text: "Soon" };
        return { severity: "success", text: "Active" };
    };


    return (
        <Card
            title={call.title}
            subTitle={
                <div className="flex flex-column gap-1">
                    <span>{(call.directorate as Organization).name}</span>
                    <span>{(call.calendar as Calendar).year}</span>
                    <span>
                        <strong>
                            <span style={{ color: "red" }}>Deadline:</span>{" "}
                            {new Date(call.deadline).toLocaleDateString()}
                        </strong>
                    </span>
                </div>
            }
            header={header}
            footer={footer}
            className="mb-3 h-full hover:shadow-lg transition-shadow duration-300"
        >
            <p className="m-0">
                {truncateText(call.description || "", 100)}
            </p>
        </Card>
    )
}