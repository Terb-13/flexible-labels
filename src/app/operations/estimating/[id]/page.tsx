import { redirect } from "next/navigation";

export default async function EstimatingDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/operations/estimates/${id}`);
}
