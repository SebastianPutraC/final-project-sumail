import MessageDetail from "../../../components/MessageDetail";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
  return <MessageDetail slug={messageId}></MessageDetail>;
}
