"use client";

import { GetCurrentUser } from "@/utils/CurrentUser";
import { MessageList } from "@/components/MessageList";

export default function InboxPage() {
  const { user } = GetCurrentUser();

  return (
    <div className="py-8 pr-8">
      <MessageList user={user} type="sent" />
    </div>
  );
}
