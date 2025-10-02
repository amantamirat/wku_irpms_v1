import { Card } from "primereact/card";
import { Project } from "../../models/project.model";
import { Call } from "@/app/(main)/calls/models/call.model";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

interface ConfirmationProps {
    project: Project;
    call: any;
}
const Confirmation = ({ project, call }: ConfirmationProps) => {
    return (<>
        <div className="p-3">
            <h4 className="mb-3">Review Your Application Infromation</h4>
            <Card className="mb-3 shadow-1">
                <p><strong>Directorate:</strong> {call.directorate.name}</p>
                <p><strong>Call:</strong> {call.title}</p>
                <p><strong>Grant:</strong> {call.grant.title}</p>
                <p><strong>Calendar:</strong> {call.calendar.year}</p>
                <p><strong>Project Title:</strong> {project.title}</p>
                <div className="flex flex-wrap gap-2">
                    <Tag value={`Collaborators: ${project.collaborators?.length ?? 0}`} severity={project.collaborators?.length ? "success" : "warning"} />
                    <Tag value={`Themes: ${project.themes?.length ?? 0}`} severity={project.themes?.length ? "success" : "warning"} />
                    <Tag value={`Phases: ${project.phases?.length ?? 0}`} severity={project.phases?.length ? "success" : "warning"} />
                    <Tag value={project.file ? `File: ${project.file.name}` : "No file"} severity={project.file ? "success" : "warning"} />
                </div>
            </Card>
            <Divider />
            <p>
                Please review the above information. If everything looks good, click{" "}
                <strong>Submit</strong> to finalize your application.
            </p>
        </div>




    </>);
}
export default Confirmation;