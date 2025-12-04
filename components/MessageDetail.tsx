"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import firebase from "../firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import ReplyIcon from "@mui/icons-material/Reply";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import ComposeForm from "./ComposeForm";
import { MessageProps } from "@/utils/types";

interface SlugProps {
  slug: string;
}

type MessageWithHistory = MessageProps & { history?: MessageProps[] };

export default function MessageDetail(slug: SlugProps) {
  const router = useRouter();
  const [message, setMessage] = useState<MessageWithHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [activeForm, setActiveForm] = useState<null | "reply" | "forward">(
    null
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openHistory, setOpenHistory] = useState<Record<string, boolean>>({});

  const toggleOpen = (id: string) => {
    setOpenMap((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  function toggleReply(id: string) {
    if (activeForm === "reply" && activeId === id) {
      setActiveForm(null);
      setActiveId(null);
      return;
    }
    setActiveForm("reply");
    setActiveId(id);
  }

  function toggleForward(id: string) {
    if (activeForm === "forward" && activeId === id) {
      setActiveForm(null);
      setActiveId(null);
      return;
    }
    setActiveForm("forward");
    setActiveId(id);
  }

  function toggleHistoryFor(id: string) {
    setOpenHistory((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  useEffect(() => {
    const getThread = async () => {
      try {
        const mainRef = doc(firebase.db, "messages", slug.slug);
        const mainSnap = await getDoc(mainRef);

        if (!mainSnap.exists()) {
          setErrorMessage("Message not found");
          return;
        }

        const mainData = mainSnap.data();

        let mainSender = "Unknown";
        if (mainData.senderId) {
          const senderRef = doc(firebase.db, "users", mainData.senderId);
          const senderSnap = await getDoc(senderRef);
          if (senderSnap.exists()) {
            mainSender = senderSnap.data().email;
          }
        }

        const mainMessage: MessageWithHistory = {
          id: mainSnap.id,
          title: mainData.title,
          content: mainData.content,
          senderId: mainData.senderId,
          senderEmail: mainSender,
          receiverId: mainData.receiverId,
          receiverEmail: mainData.receiverEmail,
          replyFromMessageId: mainData.replyFromMessageId ?? [],
          sentDate: mainData.sentDate?.toDate(),
        };

        const repliesQuery = query(
          collection(firebase.db, "messages"),
          where("replyFromMessageId", "array-contains", slug.slug),
          orderBy("sentDate", "asc")
        );

        const repliesSnap = await getDocs(repliesQuery);

        const allMessages: MessageWithHistory[] = [mainMessage];
        const messageMap: Record<string, MessageWithHistory> = {};
        messageMap[mainMessage.id] = mainMessage;

        for (const docSnap of repliesSnap.docs) {
          const data = docSnap.data();

          let senderEmail = "Unknown";
          if (data.senderId) {
            const userRef = doc(firebase.db, "users", data.senderId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              senderEmail = userSnap.data().email;
            }
          }

          const msg: MessageWithHistory = {
            id: docSnap.id,
            title: data.title,
            content: data.content,
            senderId: data.senderId,
            senderEmail,
            receiverId: data.receiverId,
            receiverEmail: data.receiverEmail,
            replyFromMessageId: data.replyFromMessageId ?? [],
            sentDate: data.sentDate?.toDate(),
          };

          allMessages.push(msg);
          messageMap[msg.id] = msg;
        }

        const withHistory = allMessages.map((msg) => {
          if (!msg.replyFromMessageId || msg.replyFromMessageId.length === 0) {
            return msg;
          }

          const toArray = (val?: string | string[]) =>
            val ? (Array.isArray(val) ? val : [val]) : [];

          const ids = toArray(msg.replyFromMessageId);

          const historyList: MessageWithHistory[] = ids
            .map((id) => messageMap[id])
            .filter(Boolean);

          return {
            ...msg,
            history: historyList,
          };
        });
        console.log("hist", withHistory);

        setMessage(withHistory);
      } catch (err) {
        console.error(err);
        setErrorMessage("Error loading message thread");
      }
    };

    if (slug.slug) getThread();
  }, [slug.slug]);

  return message?.map((m) => {
    const isOpen = openMap[m.id] ?? true;

    return (
      <div
        key={m.id}
        className={`${
          isOpen ? "py-8" : "pt-8 pb-5"
        } mr-8 border-b flex flex-col gap-5`}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleOpen(m.id)}
        >
          <div className="flex flex-col">
            <span className="font-bold">
              {m.replyFromMessageId && m.replyFromMessageId.length > 0
                ? "(replied)"
                : m.title}
            </span>

            <div className="flex gap-2">
              <span className="text-gray-500 text-sm">
                from: {m.senderEmail}
              </span>
              <span className="text-gray-500 text-sm">
                {m.sentDate &&
                  m.sentDate
                    .toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    .replace(",", " |")}
              </span>
            </div>
          </div>

          {/* Reply Forward Button */}
          <div className="flex gap-3">
            <button
              type="button"
              className="flex items-center gap-1 border-2 border-[#03045E] py-1 px-3 rounded-lg hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                toggleForward(m.id);
              }}
            >
              <ShortcutIcon className="h-5! w-5!" />
              Forward
            </button>

            <button
              type="button"
              className="flex items-center gap-1 py-1 px-3 rounded-lg bg-[#03045E] text-white hover:bg-[#05078c] "
              onClick={(e) => {
                e.stopPropagation();
                toggleReply(m.id);
              }}
            >
              <ReplyIcon className="h-5! w-5!" />
              Reply
            </button>

            {/* per-message history toggle */}
            {m.history && m.history.length > 0 && (
              <button
                className="text-blue-600 underline text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHistoryFor(m.id);
                }}
              >
                {openHistory[m.id] ? "Hide History" : "Show History"}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isOpen && (
          <div>
            <p className="whitespace-pre-wrap">{m.content}</p>

            {/* render history only for this message when toggled */}
            {openHistory[m.id] && m.history && m.history.length > 0 && (
              <div className="mt-4 bg-gray-100 p-3 rounded-lg text-sm flex flex-col gap-3">
                <p className="font-semibold">History:</p>

                {m.history.map((h) => (
                  <div
                    key={h.id}
                    className="border-l-4 border-gray-400 pl-3 py-1 bg-white rounded"
                  >
                    <p className="text-xs text-gray-500">
                      from: {h.senderEmail} •{" "}
                      {h.sentDate &&
                        h.sentDate
                          .toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          .replace(",", " |")}
                    </p>

                    <p className="whitespace-pre-wrap mt-1">{h.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reply & Forward Form */}
        {activeForm && activeId === m.id && (
          <ComposeForm type={activeForm} defaultData={m} openForm={true} />
        )}
      </div>
    );
  });
}
