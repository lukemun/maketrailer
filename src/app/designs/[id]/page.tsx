import { DesignEditor } from "@/components/DesignEditor";

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignEditor designId={(await params).id} />;
}
