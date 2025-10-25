'use client';
import ApplicantManager from './components/ApplicantManager';
//import { Scope } from './models/applicant.model';



const ApplicantPage = () => {

    /*
    const searchParams = useSearchParams();
    const router = useRouter();
    const scopeParam = searchParams.get('scope');

    const isValidScope = (value: string): value is Scope =>
        Object.values(Scope).includes(value as Scope);

    const shouldRedirect = !scopeParam || !isValidScope(scopeParam);

    useEffect(() => {
        if (shouldRedirect) {
            router.push('/');
        }
    }, [shouldRedirect, router]);

    if (shouldRedirect) {
        return null;
    }
    const scope = scopeParam as Scope;
    */
    return (
        <ApplicantManager  />
    );
};

export default ApplicantPage;
