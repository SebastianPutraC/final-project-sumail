import MessageDetail from "../../../../components/messageDetail";
import Header from "@/components/Header";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <div>
        <Header></Header>
      </div>
      <div>
        <MessageDetail slug={slug}></MessageDetail>
      </div>
    </>
  );
}
