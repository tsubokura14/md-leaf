import { Skeleton, SkeletonPage } from "@/components/skeleton";

/** ホームを開くのに時間がかかるあいだの、題と段落・リストの形 */
export default function HomeLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-1/2" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-8 space-y-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </SkeletonPage>
  );
}
