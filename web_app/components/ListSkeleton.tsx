import { Skeleton } from "primereact/skeleton";

export default function ListSkeleton({ rows = 10 }) {
    return (
        <div className="p-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center mb-3">
                    <Skeleton width="50px" height="2rem" className="mr-2" />
                    <Skeleton width="200px" height="2rem" className="mr-2" />
                    <Skeleton width="80px" height="2rem" className="mr-2" />
                    <Skeleton width="100px" height="2rem" className="mr-2" />
                    <Skeleton width="120px" height="2rem" />
                </div>
            ))}
        </div>
    );
}
