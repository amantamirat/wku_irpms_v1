'use client';

import { Skeleton } from 'primereact/skeleton';

interface GridSkeletonProps {
  count?: number;
}

/**
 * Skeleton loader for Grid / Card layouts
 */
export function GridSkeleton({ count = 4 }: GridSkeletonProps) {
  return (
    <div className="grid mt-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="col-12 md:col-6 p-2">
          <div className="card p-4 surface-card border-round shadow-1">
            <Skeleton width="40%" height="1.5rem" className="mb-2" />
            <Skeleton width="70%" height="1rem" className="mb-3" />
            <Skeleton width="100%" height="4rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ListSkeletonProps {
  rows?: number;
}

/**
 * Skeleton loader for DataTable / List layouts
 */
export function ListSkeleton({ rows = 10 }: ListSkeletonProps) {
  return (
    <div className="p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex align-items-center mb-3">
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