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

// interface MessageProps {
//   id: string;
//   senderId: string;
//   senderEmail?: string;
//   receiverId: string;
//   receiverEmail: string;
//   title: string;
//   content: string;
//   sentDate: Date;
// }

interface SlugProps {
  slug: string;
}

export default function MessageDetail(slug: SlugProps) {
  const router = useRouter();
  const [message, setMessage] = useState<MessageProps[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [openReply, setOpenReply] = useState<Record<string, boolean>>({});

  const toggleOpen = (id: string) => {
    setOpenMap((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  function toggleReply(id: string) {
    setOpenReply((prev) => ({
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

        const mainMessage: MessageProps = {
          id: mainSnap.id,
          title: mainData.title,
          content: mainData.content,
          senderId: mainData.senderId,
          senderEmail: mainSender,
          receiverId: mainData.receiverId,
          receiverEmail: mainData.receiverEmail,
          sentDate: mainData.sentDate?.toDate(),
        };

        const repliesQuery = query(
          collection(firebase.db, "messages"),
          where("replyFromMessageId", "array-contains", slug.slug),
          orderBy("sentDate", "asc")
        );

        const repliesSnap = await getDocs(repliesQuery);

        const replies: MessageProps[] = [];

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

          replies.push({
            id: docSnap.id,
            title: data.title,
            content: data.content,
            senderId: data.senderId,
            senderEmail: senderEmail,
            receiverId: data.receiverId,
            receiverEmail: data.receiverEmail,
            replyFromMessageId: data.replyFromMessageId ?? [],
            sentDate: data.sentDate?.toDate(),
          });
        }

        setMessage([mainMessage, ...replies]);
      } catch (err) {
        console.error(err);
        setErrorMessage("Error loading message thread");
      }
    };

    if (slug.slug) getThread();
  }, [slug.slug]);

  // const replyMessage = () => {
  //   if (!message) return;

  //   // Create URL parameters
  //   const params = new URLSearchParams({
  //     mode: "reply",
  //     sender: message.senderEmail || "", // Pass the email we fetched
  //     title: message.title,
  //     content: message.content,
  //   });

  //   // Navigate to Compose page with data
  //   router.push(`/user/compose?${params.toString()}`);
  // };

  // const forwardMessage = () => {
  //   if (!message) return;

  //   // Create URL parameters (No sender needed for forward)
  //   const params = new URLSearchParams({
  //     mode: "forward",
  //     title: message.title,
  //     content: message.content,
  //   });

  //   // Navigate to Compose page
  //   router.push(`/user/compose?${params.toString()}`);
  // };

  return message?.map((m) => {
    const isOpen = openMap[m.id] ?? true;
    const isReply = openReply[m.id];

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
                {m.sentDate
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
              }}
            >
              <ShortcutIcon className="h-5! w-5!" />
              Forward
            </button>
            <button
              type="button"
              className="flex items-center gap-1 py-1 px-3 rounded-lg bg-[#03045E] border-2 border-[#03045E] text-white hover:bg-white hover:text-[#03045E]"
              onClick={(e) => {
                e.stopPropagation();
                toggleReply(m.id);
              }}
            >
              <ReplyIcon className="h-5! w-5!" />
              Reply
            </button>
          </div>
        </div>

        {/* Content */}
        {isOpen && (
          <div>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        )}

        {/* Reply Form */}
        {isReply && (
          <div>
            <ComposeForm type="reply" defaultData={m} />
          </div>
        )}
      </div>
    );
  });
}
