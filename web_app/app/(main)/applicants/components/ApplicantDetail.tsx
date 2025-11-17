import { TabPanel, TabView } from "primereact/tabview";
import ReviewerManager from "../../projects/reviewers/components/ReviewerManager";
import { Applicant } from "../models/applicant.model";



interface ApplicantDetailProps {
    applicant: Applicant;
}

const ApplicantDetail = ({ applicant }: ApplicantDetailProps) => {
    return (
        <>
            <TabView>
                <TabPanel header="Collaborations">

                </TabPanel>
                <TabPanel header="Evaluations">
                    <ReviewerManager applicant={applicant} />
                </TabPanel>
                <TabPanel header="Experiences">

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