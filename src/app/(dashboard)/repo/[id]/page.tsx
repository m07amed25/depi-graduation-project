import {
  RepositoryDetailPage,
  type RepositoryDetailPageProps,
} from "@/features/repo";

export default function Page({ params }: RepositoryDetailPageProps) {
  return <RepositoryDetailPage params={params} />;
}
