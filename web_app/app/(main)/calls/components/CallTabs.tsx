import { TabPanel, TabView } from "primereact/tabview";
import ReviewerManager from "../../projects/reviewers/components/ReviewerManager";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import SpecializationManager from "../../specializations/components/SpecializationManager";
import ProjectManager from "../../projects/components/ProjectManager";
import { Call } from "../models/call.model";
import StageManager from "../stages/components/StageManager";

interface CallTabsProps {
    call: Call;
}

const CallTabs = ({ call }: CallTabsProps) => {
    return (
        <>
            <TabView>
                <TabPanel header="Stages">
                    <StageManager call={call} />
                </TabPanel>
                <TabPanel header="Projects">
                    <ProjectManager call={call} />
                </TabPanel>
            </TabView>
        </>
    );
}
export default CallTabs;