import { TabPanel, TabView } from "primereact/tabview";
import ReviewerManager from "../../projects/reviewers/components/ReviewerManager";
import { Applicant } from "../models/applicant.model";
import ExperienceManager from "../experiences/components/ExperienceManager";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";

interface ApplicantDetailProps {
    applicant: Applicant;
}

const ApplicantDetail = ({ applicant }: ApplicantDetailProps) => {
    return (
        <>
            <TabView>
                <TabPanel header="Collaborations">
                    <CollaboratorManager applicant={applicant} />
                </TabPanel>
                <TabPanel header="Evaluations">
                    <ReviewerManager applicant={applicant} />
                </TabPanel>
                <TabPanel header="Experiences">
                    <ExperienceManager applicant={applicant} />
                </TabPanel>
                <TabPanel header="Specializations">

                </TabPanel>
                <TabPanel header="Publications">

                </TabPanel>
                <TabPanel header="Enrollements">

                </TabPanel>
            </TabView>
        </>

    );
}

export default ApplicantDetail;