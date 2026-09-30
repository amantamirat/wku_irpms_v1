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

interface ArticleSkeletonProps {
  count?: number;
}

/**
 * Skeleton loader for detailed Article / Rich Card layouts
 */
export function ArticleSkeleton({ count = 1 }: ArticleSkeletonProps) {
  return (
    <div className="flex flex-column gap-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex gap-4 mb-5">
            <Skeleton shape="circle" size="3rem" />
            <div className="flex flex-col gap-1 w-full">
              <Skeleton width="50%" height="1.2rem" />
              <Skeleton width="30%" height="0.8rem" />
            </div>
          </div>
          <Skeleton width="100%" height="2rem" className="mb-5" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} height="4rem" borderRadius="1rem" />
            ))}
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