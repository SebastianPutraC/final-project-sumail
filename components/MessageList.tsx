"use client";

import firebase from "../firebase/firebaseConfig";
import { useState, useEffect, useMemo } from "react";
import {
  onSnapshot,
  collection,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import StarIcon from "@mui/icons-material/Star";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import { MessageProps, MessageListProps, FormattedUsers } from "@/utils/types";

export function MessageList({ user, type }: MessageListProps) {
  const [allMessages, setAllMessages] = useState<MessageProps[]>([]);
  const [allUsers, setAllUsers] = useState<FormattedUsers[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [searchInput, setSearhInput] = useState<string>("");
  const [limit, setLimit] = useState<number>(5);

  const router = useRouter();

  const limitOptions = [5, 10, 20, 30];

  // Filter Search
  const filteredMessages = useMemo(() => {
    if (!searchInput.trim()) return allMessages;

    const q = searchInput.toLowerCase();
    return allMessages.filter(
      (m) =>
        m.senderName?.toLowerCase().includes(q) ||
          m.title?.toLowerCase().includes(q) ||
        m.content?.toLowerCase().includes(q)
    );
  }, [allMessages, searchInput]);

  // Sort
  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort((a, b) => {
      return b.sentDate.getTime() - a.sentDate.getTime();
    });
  }, [filteredMessages]);

  // Pagination
  const maxPage = Math.max(0, Math.ceil(sortedMessages.length / limit) - 1);
  const safePage = Math.min(page, maxPage);
  const paginated = useMemo(() => {
    const start = safePage * limit;
    return sortedMessages.slice(start, start + limit);
  }, [sortedMessages, safePage, limit]);

  const toggleStar = async (messageId: string, starred: boolean) => {
    const ref = doc(firebase.db, "messages", messageId);

    if (starred) {
      await updateDoc(ref, { starredId: arrayRemove(user.id) });
    } else {
      await updateDoc(ref, { starredId: arrayUnion(user.id) });
    }
  };

  // Get Messages
  useEffect(() => {
    const messagesQuery = query(
      collection(firebase.db, "messages"),
      where(
        type === "sent"
          ? "senderId"
          : type === "starred"
          ? "starredId"
          : "receiverId",
        type === "sent" ? "==" : "array-contains",
        user.id
      ),
      where("replyFromMessageId", "==", ""),
    );

    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      let messagesArray = snapshot.docs.map((d) => {
        const senderId = d.data().senderId;
        const sender = allUsers?.find((u) => u.id === senderId);

        return {
          id: d.id,
          senderId,
          senderName: sender?.name ?? "Unknown",
          receiverId: d.data().receiverId,
          title: d.data().title,
          content: d.data().content,
          sentDate: d.data().sentDate?.toDate() ?? new Date(),
          starred: d.data().starredId?.includes(user?.id),
            readId : d.data().readId?.includes(user?.id),
            activeId : d.data().activeId,
        };
      });
        messagesArray = messagesArray.filter(message => message.activeId?.includes(user.id));
      setAllMessages(messagesArray);
    });

    return () => unsub();
  }, [user?.id, allUsers, limit, type]);

  // Get users
  useEffect(() => {
    const unsub = onSnapshot(collection(firebase.db, "users"), (snapshot) => {
      const users = snapshot.docs.map((u) => ({
        id: u.id,
        name: String(u.data().name),
      }));

      setAllUsers(users);
    });

    return () => unsub();
  }, []);

    const deleteMessage = async (messages: string[]) => {
        for (let i = 0; i < messages.length; i++)
        {
            const ref = doc(firebase.db, "messages", messages[i]);
            await updateDoc(ref, {activeId: arrayRemove(user.id)})
        }
    }

  return (
    <div>
      {/* Header */}
      <div className="bg-[#03045E] p-3 rounded-lg mb-3 text-white flex gap-5 justify-between items-center">
        {/* Toggle Checked */}
        <div className="flex gap-3">
          <div className="cursor-pointer">
            {checked.length > 0 ? (
              <IndeterminateCheckBoxIcon
                className={`w-5! h-5!`}
                onClick={() => setChecked([])}
              />
            ) : (
              <CheckBoxOutlineBlankIcon
                className={`w-5! h-5!`}
                onClick={() => setChecked(paginated.map((m) => m.id))}
              />
            )}
          </div>
          <div className="cursor-pointer">
            <DeleteOutlineIcon className={`w-5! h-5!`} onClick={async () => {
                await deleteMessage(checked)
                setChecked([]);
            }}/>

          </div>
        </div>

        {/* Search */}
        <div className="bg-white py-1 px-3 rounded-lg flex gap-2 items-center w-1/2">
          <SearchIcon className="text-black border-none" />
          <input
            placeholder="Search email"
            className="text-gray-500 text-lg w-full focus-visible:outline-none"
            value={searchInput}
            onChange={(e) => setSearhInput(e.target.value)}
          />
        </div>

        {/* Data Limit */}
        <div className="text-white flex gap-2 items-center">
          <span>Items per page</span>
          <select
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-md"
          >
            {limitOptions.map((opt, index) => {
              return (
                <option key={index} value={opt} className="text-black">
                  {String(opt)}
                </option>
              );
            })}
          </select>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-3 text-nowrap">
          <KeyboardArrowLeftIcon
            className={`w-6! h-6! ${safePage === 0 ? "text-gray-400" : ""}`}
            onClick={() => {
                if ((page - 1) < 0)
                    return
                setPage(safePage - 1)}}
          />

          <span className="text-sm font-medium">
            Page {safePage + 1} of {maxPage + 1}
          </span>

          <KeyboardArrowLeftIcon
            className={`rotate-180 w-6! h-6! ${
              safePage === maxPage ? "text-gray-400" : ""
            }`}
            onClick={() => setPage(safePage + 1)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <tbody>
            {paginated.map((m) => {
              console.log("m", m);
              return (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/mail/${m.id}`)}
                  className={`border-b border-gray-100 last:border-none cursor-pointer hover:bg-gray-50 transition hover:shadow-sm 
                  ${checked.includes(m.id) && "bg-blue-50"} ${m.readId && "bg-gray-200 hover:bg-gray-300"} `
                }
                >
                  <td className="p-3 flex items-center gap-4 w-10">
                    <input
                      type="checkbox"
                      checked={checked.includes(m.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        e.target.checked
                          ? setChecked([...checked, m.id])
                          : setChecked(checked.filter((x) => x !== m.id))
                      }
                      className="h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                    <div onClick={(e) => e.stopPropagation()}>
                      {m.starred ? (
                        <StarIcon
                          className="w-5! h-5! text-[#03045E]"
                          onClick={() => toggleStar(m.id, m.starred ?? false)}
                        />
                      ) : (
                        <StarBorderOutlinedIcon
                          className="w-5! h-5!"
                          onClick={() => toggleStar(m.id, m.starred ?? false)}
                        />
                      )}
                    </div>
                  </td>

                  <td className="p-3 font-medium max-w-[100px]">
                    {m.senderName || m.senderId}
                  </td>

                  <td className="p-3 max-w-[300px] truncate">
                    <span className="font-medium">{m.title}</span> - {m.content}
                  </td>

                  <td className="p-3 w-[150px]">
                    {m.sentDate
                      .toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .replace(",", " |")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
