"use client";

import { GetCurrentUser } from "@/utils/CurrentUser";
import { MessageList } from "@/components/MessageList";

export default function InboxPage() {
  const { user, loading } = GetCurrentUser();
  const isLogged = user.email !== "" && !loading;

  return (
    <div className="py-8 pr-8">
      <MessageList user={user} />
    </div>
  );
}
