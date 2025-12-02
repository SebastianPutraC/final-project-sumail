"use client";

import firebase from "../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  Timestamp,
  onSnapshot,
  where,
  query,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GetCurrentUser } from "@/utils/CurrentUser";
import { useForm } from "react-hook-form";
import { composeSchema } from "@/validation/composeSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { MessageData, Receiver, FormValues } from "@/utils/types";

export default function ComposeForm( {hideModal = Function()}) {
  const [allMessages, setAllMessages] = useState<MessageData[]>([]);
  const [allUsers, setAllUsers] = useState<Receiver[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Receiver[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | string>();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { user } = GetCurrentUser();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(composeSchema),
    defaultValues: { receiver: "", subject: "", content: "" },
  });

  // --- Sengaja tidak dihapus untuk backup sementara dulu ---
  // const sendMessage = async () => {
  //   const validationError = validateData();
  //   if (validationError.receiverEmail !== "" || validationError.title !== "") {
  //     setComposeError(validationError);
  //   } else {
  //     try {
  //       const userDocs = await getDocs(collection(firebase.db, "users"));
  //       const emailDocs = userDocs.docs.map((doc) => doc.data().email);
  //       const receiverIndex = emailDocs.findIndex(
  //         (receiver) => receiver === composeForm.receiverEmail
  //       );

  //       if (receiverIndex === -1) {
  //         setOtherError("No receiver email");
  //         throw new Error(otherError);
  //       }

  //       const receiverId = userDocs.docs[receiverIndex].id;

  //       const receiverRef = doc(firebase.db, "users", receiverId);
  //       const receiverSnap = await getDoc(receiverRef);
  //       if (!receiverSnap.exists()) {
  //         setOtherError("No available receiver");
  //         throw new Error(otherError);
  //       }

  //       const docRef = await addDoc(collection(firebase.db, "messages"), {
  //         senderId: user.id,
  //         receiverId: receiverId,
  //         title: composeForm.title,
  //         content: composeForm.content,
  //         sentDate: Timestamp.fromDate(new Date()),
  //         starredId: ["0"],
  //       });

  //       const docSnap = await getDoc(docRef);
  //       if (!docSnap.exists()) {
  //         setOtherError("Missing added document");
  //         throw new Error(otherError);
  //       } else {
  //         router.push("/");
  //       }
  //     } catch (e) {
  //       console.error(otherError);
  //     }
  //   }
  // };

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
    setSelectedReceiver(user);
    setSearchInput("");
    setSuggestions([]);
  };

  async function onSubmit(data: FormValues) {
    const payload = {
      senderId: user.id,
      receiverId:
        typeof selectedReceiver !== "string" ? selectedReceiver?.id : null,
      receiverEmail: selectedReceiver === "string" ? selectedReceiver : null,
      title: data.subject,
      content: data.content,
      sentDate: Timestamp.fromDate(new Date()),
      starredId: ["0"],
    };

    try {
      setIsLoading(true);

      await addDoc(collection(firebase.db, "messages"), payload);
      toast.success("Email has been sent!");
      setTimeout(() => {
        router.push("/mail/sent");
      }, 1000);
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
    setValue(
      "receiver",
      typeof selectedReceiver === "string"
        ? selectedReceiver
        : selectedReceiver?.email || ""
    );
  }, [selectedReceiver, setValue]);

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm px-5 py-3">
      <form
        className="flex flex-col gap-2"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <div className="relative">
          <div className="flex items-center">
            <label className="font-medium text-nowrap w-20 mr-3">Send To</label>
            {selectedReceiver && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-2 rounded-full w-fit">
                {typeof selectedReceiver === "string"
                  ? selectedReceiver
                  : selectedReceiver.email}
                <button
                  type="button"
                  onClick={() => setSelectedReceiver(undefined)}
                  className="text-sm ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSelectedReceiver(searchInput);
                  setSearchInput("");
                  setSuggestions([]);
                }
              }}
              type="text"
              className="border-b border-gray-200 rounded p-2 w-full focus-visible:outline-0"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="absolute bg-white border border-gray-200 w-full rounded shadow-md mt-1 z-10">
              {suggestions.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSelect(u)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {u.email}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="w-20 font-medium">Subject</label>
          <input
            {...register("subject")}
            type="text"
            className="border-b border-gray-200 rounded p-2 w-full focus-visible:outline-0"
          />
        </div>
        <textarea
          {...register("content")}
          className="rounded-lg h-65 p-3 resize-none"
          placeholder="Write your mail here..."
        />
        <div className="flex gap-1">
          {[errors.receiver, errors.subject, errors.content]
            .filter(Boolean)
            .map((err, i) => (
              <p key={i} className="text-red-500 text-sm mt-1">
                {err?.message} |
              </p>
            ))}
        </div>
        <button
          type="submit"
          disabled={!isValid}
          className="flex items-center justify-center bg-[#00B4D8] hover:bg-[#0096C7] font-semibold text-white rounded-lg p-3 w-full text-lg transition shadow-sm hover:shadow-md cursor-pointer disabled:cursor-auto disabled:bg-gray-300"
        >
          {isLoading ? <ClipLoader size={25} color="white" /> : "Send Message"}
        </button>
          <button
              onClick={() => {hideModal()}}
              className="flex items-center justify-center bg-red-500 hover:bg-red-700 font-semibold text-white rounded-lg p-3 w-full text-lg transition shadow-sm hover:shadow-md cursor-pointer disabled:cursor-auto disabled:bg-gray-300"
          >
              {isLoading ? <ClipLoader size={25} color="white" /> : "Close Modal"}
          </button>
      </form>
    </div>
  );
}
