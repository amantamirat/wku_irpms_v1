import { TabPanel, TabView } from "primereact/tabview";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import ReviewerManager from "../../calls/reviewers/components/ReviewerManager";
import SpecializationManager from "../../specializations/components/SpecializationManager";
import ExperienceManager from "../experiences/components/ExperienceManager";
import { Applicant } from "../models/applicant.model";

interface ApplicantDetailProps {
    applicant: Applicant;
}

const ApplicantDetail = ({ applicant }: ApplicantDetailProps) => {
    return (
        <>
            <TabView>
                {
                    /**
                     * <TabPanel header="Projects">
                    <ProjectManager leadPI={applicant} />
                </TabPanel>
                     */
                }                
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
                    <SpecializationManager applicant={applicant} />
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