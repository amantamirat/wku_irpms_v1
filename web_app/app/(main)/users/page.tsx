'use client';
import UserManager from './components/UserManager';

const UserPage = () => {
    // Step 1: Manage workspace state at page level
    // const [selectedWorkspace, setSelectedWorkspace] = useState<Organization | undefined>();
    return (
        <>
            {/* Step 2: Pass state + setter to WorkspaceSelector
             <WorkspaceSelector
                value={selectedWorkspace}
                onChange={setSelectedWorkspace}
            />
            */}

            {/* Step 3: Pass selected workspace to ApplicantManager */}
            <UserManager />
        </>
    );
};

export default UserPage;
