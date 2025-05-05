import { Metadata } from 'next';
import Layout from '../../layout/layout';
import RequireAuth from '@/components/RequireAuth';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'WKU-IRPMS',
    description: 'Wolkite University Institutional Research and Project Managment System',
    robots: { index: false, follow: false },
    openGraph: {
        type: 'website',
        title: 'WKU-IRPMS',
        url: 'https://www.wku.edu.et/',
        description: 'Wolkite University Institutional Research and Project Managment System',
        images: ['https://www.primefaces.org/static/social/sakai-react.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <RequireAuth><Layout>{children}</Layout></RequireAuth>;
}
