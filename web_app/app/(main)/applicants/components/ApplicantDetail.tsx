import { TabPanel, TabView } from "primereact/tabview";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import ReviewerManager from "../../calls/reviewers/components/ReviewerManager";
import SpecializationManager from "../../specializations/components/SpecializationManager";
import ExperienceManager from "../experiences/components/ExperienceManager";
import { Applicant } from "../models/applicant.model";
import StudentManager from "../students/components/StudentManager";
import PublicationManager from "../publications/components/PublicationManager";

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
                {
                    /**
                     * <TabPanel header="Specializations">
                    <SpecializationManager applicant={applicant} />
                </TabPanel>
                     */
                }
                <TabPanel header="Publications">
                    <PublicationManager applicant={applicant} />
                </TabPanel>
                <TabPanel header="Enrollements">
                    <StudentManager applicant={applicant} />
                </TabPanel>
            </TabView>
        </>

    );
}

export default ApplicantDetail;