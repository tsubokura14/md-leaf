import { Skeleton, SkeletonPage } from "@/components/skeleton";

/** ノートを開くのに時間がかかるあいだの、題・段落・見出しの形 */
export default function NoteLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-3/4" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="mt-8 h-6 w-1/3" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="mt-6 h-32 w-full" />
    </SkeletonPage>
  );
}
