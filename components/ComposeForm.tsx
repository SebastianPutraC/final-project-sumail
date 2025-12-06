"use client";

import firebase from "../firebase/firebaseConfig";
import {
    addDoc,
    collection,
    Timestamp,
    onSnapshot,
    where,
    query,
    updateDoc,
    getDoc, doc, getDocs, limit,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GetCurrentUser } from "@/utils/CurrentUser";
import { useForm } from "react-hook-form";
import { composeSchema } from "@/validation/composeSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { MessageData, Receiver, FormValues, MessageProps } from "@/utils/types";
import CloseIcon from "@mui/icons-material/Close";

interface ComposeFormProps {
  type?: string;
  defaultData?: MessageProps;
  isModal?: boolean;
  hideModal?: () => void;
  className?: string;
  openForm?: boolean;
}
let inputId = 0
export default function ComposeForm({
  type,
  defaultData,
  isModal,
  hideModal,
  className,
  openForm,
}: ComposeFormProps) {
  const [allMessages, setAllMessages] = useState<MessageData[]>([]);
  const [allUsers, setAllUsers] = useState<Receiver[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Receiver[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  //console.log("dd", defaultData);

  const router = useRouter();
  const { user } = GetCurrentUser();
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(composeSchema),
    defaultValues: { receiver: [], subject: "", content: "" },
  });

  const handleSearch = (value: string) => {
    setSearchInput(value);

    if (!value) {
      setSuggestions([]);
      return;
    }

    const uniqueSender = Array.from(
      new Map(
        allMessages
          .filter((m) =>
            m.senderEmail.toLowerCase().includes(value.toLocaleLowerCase())
          )
          .map((m) => [m.senderId, m])
      ).values()
    );

    setSuggestions(
      uniqueSender.map((m) => ({
        id: m.senderId,
        email: m.senderEmail,
      }))
    );
  };

  const handleSelect = (user: Receiver) => {
      inputId = inputId + 1
      user.arrayId = inputId;
      setSelectedReceiver(prevReceiver => [...prevReceiver, user]);
    setValue("receiver", [...selectedReceiver, user]);
    setSearchInput("");
    setSuggestions([]);
    console.log(selectedReceiver);
  };

  async function onSubmit(data: FormValues) {
      const isSender= selectedReceiver.some(item => item.email === user.email);

    const payload = {
      senderId: user.id,
      senderEmail: user.email,
      receiverId:
        selectedReceiver.map(u => u.id).filter(u => u),
      receiverEmail:
        selectedReceiver.map(u => u.email).filter(u => u),
      title: data.subject,
      content: data.content,
      replyFromMessageId:
        type === "reply"
          ? [...(defaultData?.replyFromMessageId ?? []), defaultData?.id]
          : "",
      sentDate: Timestamp.fromDate(new Date()),
      starredId: ["0"],
        readId: ["0"],
        activeId: isSender ? [...selectedReceiver.map(u => u.id).filter(u => u)]
            : [user.id, ...selectedReceiver.map(u => u.id).filter(u => u)],
    };
    console.log("pay", payload);

    try {
      setIsLoading(true);

      await addDoc(collection(firebase.db, "messages"), payload);
      toast.success("Email has been sent!");
      if (type !== "reply") {
        setTimeout(() => {
          router.push("/mail/sent");
        }, 1000);
        hideModal && hideModal();
      }
      else {
          if (payload.replyFromMessageId[0]) {
              const parentMessage = payload.replyFromMessageId[0];
              const mainRef = doc(firebase.db, "messages", parentMessage);
              const mainSnap = await getDoc(mainRef);

              if (!mainSnap.exists()) {
                  throw new Error("Parent message doesn't exist")
              }
              await updateDoc(mainRef, { readId: [user?.id] });
              location.reload();
          }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send email");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;

    const queryFilter = query(
      collection(firebase.db, "messages"),
      where("receiverId", "==", user.id)
    );

    const unsub = onSnapshot(queryFilter, (snapshot) => {
      const messagesArray = snapshot.docs.map((d) => {
        const senderId = d.data().senderId;
        const sender = allUsers?.find((u) => u.id === senderId);

        return {
          senderId,
          senderName: sender?.name ?? "Unknown",
          senderEmail: sender?.email ?? "Unknown",
          receiverId: d.data().receiverId,
        };
      });

      setAllMessages(messagesArray);
    });

    return () => unsub();
  }, [user?.id, allUsers]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firebase.db, "users"), (snapshot) => {
      const users = snapshot.docs.map((u) => ({
        id: u.id,
        name: u.data().name,
        email: u.data().email,
      }));

      setAllUsers(users);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (type === "reply") {
        const senderReceiver : Receiver =
            {name : defaultData?.senderName,
            email : defaultData?.senderEmail,
            id : defaultData?.senderId,
            arrayId : inputId};
      setValue("receiver", [senderReceiver.email]);
      setSelectedReceiver(
          //Sender info
          [senderReceiver]
      );
      setValue("subject", defaultData?.title ?? "");
      setValue("content", "");
    } else if (type === "forward") {
      const dateText = defaultData?.sentDate
        ? defaultData.sentDate.toLocaleString()
        : "(unknown date)";

      // 1. Forwarded Header Gmail Style
      const forwardHeader = `---------- Forwarded Message ----------
From: ${defaultData?.senderEmail}
Date: ${dateText}
Subject: ${defaultData?.title}

`;

      // 2. Original content
      const originalContent =
        `
----------------------------------------
On ${defaultData?.sentDate}, ${defaultData?.senderEmail} wrote:

${defaultData?.content}

` || "";

      // 3. History builder (karena history berupa array of object)
      let historyText = "";

      if (
        Array.isArray(defaultData?.history) &&
        defaultData.history.length > 0
      ) {
        defaultData.history.forEach((h) => {
          const hDate = h.sentDate
            ? new Date(h.sentDate).toLocaleString()
            : "(unknown date)";

          historyText += `
----------------------------------------
On ${hDate}, ${h.senderEmail} wrote:

${h.content}

`;
        });
      }

      // 4. Gabungkan semuanya
      const fullForwardContent = forwardHeader + historyText + originalContent;

      setValue("subject", `Fwd: ${defaultData?.title}`);
      setValue("content", fullForwardContent);
      setValue("receiver", []);
      setSelectedReceiver([]);
    }
  }, [type, defaultData, setValue, setSelectedReceiver]);
  //console.log("dh", defaultData?.history);

  useEffect(() => {
    if (selectedReceiver.length === 0) return;

    setValue(
      "receiver",
      [],
      { shouldValidate: true }
    );
  }, [selectedReceiver, setValue]);

  useEffect(() => {
    if (!openForm) {
      setValue("receiver", []);
      setValue("subject", "");
      setValue("content", "");
      setSelectedReceiver([]);
      clearErrors();
    }
  }, [openForm, clearErrors, setValue]);

  //console.log(defaultData);

  if (!openForm) return;
  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <div className="relative bg-white rounded-lg w-full">
        {/* CLOSE MODAL */}
        {isModal && (
          <div className="w-full text-end">
            <CloseIcon
              className="w-5! h-5! cursor-pointer absolute top-3 right-2"
              onClick={() => (hideModal ? hideModal() : {})}
            />
          </div>
        )}
        <div className="border border-gray-200 rounded-lg shadow-sm px-5 py-3">
          <form
            className="flex flex-col gap-2"
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}
          >
            {/* SEND TO */}
            <div className="relative">
              <div
                className={`flex items-center ${type === "reply" && "hidden"}`}
              >
                <label className="font-medium text-nowrap w-20 mr-3">
                  {type === "forward" ? "Forward To" : "Send To"}
                </label>
                  <div className="flex flex-row">
                      {selectedReceiver.map((item) => (
                          <div key={item.arrayId}>
                              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-2 rounded-full w-fit">
                                  {item.email}
                                  <button
                                      type="button"
                                      onClick={() => {
                                          const filteredArray =
                                              selectedReceiver.filter(receiver => receiver.arrayId !== item.arrayId)
                                          setSelectedReceiver(filteredArray);
                                          setValue("receiver", [filteredArray]);
                                      }}
                                      className="text-sm ml-1 hover:text-red-600"
                                  >
                                      ×
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
                {/* Selected receiver pill */}
                {/*selectedReceiver && (

                )*/}

                {/* Search input */}
                <input
                  value={searchInput}
                  onChange={(e) => {
                    handleSearch(e.target.value);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                        if (searchInput.length <= 0)
                            return;

                        inputId = inputId + 1
                        const emailQuery = query(
                            collection(firebase.db, "users"),
                            where("email", "==", searchInput),
                            limit(1)
                        );

                        const snap = await getDocs(emailQuery);
                        const newInput: Receiver = {
                            email: searchInput,
                            arrayId: inputId,
                        }
                        if (snap.docs.length > 0) {
                            newInput.id = snap.docs[0].id;
                            newInput.name = snap.docs[0].data().name;
                        }

                        setSelectedReceiver(prevReceiver => [...prevReceiver, newInput]);
                        setValue("receiver", [...selectedReceiver, user]);
                      setSearchInput("");
                      setSuggestions([]);
                      console.log(selectedReceiver);
                    }
                  }}
                  type="text"
                  className="border-b border-gray-200 rounded p-2 w-full focus-visible:outline-0"
                />
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute bg-white border border-gray-200 w-full rounded shadow-md mt-1 z-10">
                  {suggestions.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        handleSelect(u);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {u.email}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBJECT (hidden if reply & forward) */}
            <div
              className={`flex items-center gap-3 ${
                (type === "reply" || type === "forward") && "hidden"
              }`}
            >
              <label className="w-20 font-medium">Subject</label>
              <input
                {...register("subject")}
                type="text"
                className="border-b border-gray-200 rounded p-2 w-full focus-visible:outline-0"
              />
            </div>

            {/* CONTENT (hidden if forward) */}
            <textarea
              {...register("content")}
              className={`rounded-lg h-100 p-3 resize-none`}
              placeholder="Write your mail here..."
            />

            {/* ERRORS */}
            <div className="flex gap-1">
              {[errors.receiver, errors.subject, errors.content]
                .filter(Boolean)
                .map((err, i) => (
                  <p key={i} className="text-red-500 text-sm mt-1">
                    {err?.message} |
                  </p>
                ))}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={!isValid || Object.keys(errors).length > 0}
              className="flex items-center justify-center bg-[#00B4D8] hover:bg-[#0096C7] font-semibold text-white rounded-lg p-3 w-full text-lg transition shadow-sm hover:shadow-md cursor-pointer disabled:cursor-auto disabled:bg-gray-300"
            >
              {isLoading ? (
                <ClipLoader size={25} color="white" />
              ) : type === "reply" ? (
                "Send Reply"
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
