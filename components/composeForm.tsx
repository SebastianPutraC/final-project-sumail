'use client'

import firebase from  "../firebase/firebaseConfig"
import {addDoc, collection, Timestamp, getDoc, doc} from "firebase/firestore";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {GetCurrentUser} from "@/utils/CurrentUser";

interface ComposeProps {
    receiverId: string;
    title: string;
    content: string;
}

export default function ComposeForm()
{
    const router = useRouter();
    const [composeForm, setComposeForm] = useState<ComposeProps>(
        {receiverId: "", title: "", content: ""})
    const [composeError, setComposeError] = useState<ComposeProps>(
        {receiverId: "", title: "", content: ""})
    const {user, loading} = GetCurrentUser();

    const [otherError, setOtherError] = useState("Unknown Error");

    const handleChange =
        (event : React.ChangeEvent<HTMLInputElement> |
            React.ChangeEvent<HTMLTextAreaElement>) => {

            setComposeForm({...composeForm, [event.target.name]: event.target.value})
            setComposeError({...composeError, [event.target.name]: ""})
        };

    const validateData = () => {
        const newErrors : ComposeProps =
            {receiverId: "", title: "", content: ""};
        if (!composeForm.receiverId) newErrors.receiverId = "Receiver is required";
        if (!composeForm.title) newErrors.title = "Title is required";
        if (!composeForm.content) newErrors.content = "Content is required";

        return newErrors;
    }

    const sendMessage = async () => {
        const validationError = validateData();
        if(validationError.receiverId !== "" && validationError.title !== ""
            && validationError.content !== "")
        {
            setComposeError(validationError);
        }
        else
        {
            try {
                const receiverRef = doc(firebase.db, "users",
                    composeForm.receiverId)
                const receiverSnap = await getDoc(receiverRef)
                if (!receiverSnap.exists() || receiverSnap.id === user.id)
                {
                    setOtherError("No available receiver");
                    throw new Error(otherError)
                }

                const docRef = await addDoc(collection
                (firebase.db, "messages"), {
                    senderId: user.id,
                    receiverId: composeForm.receiverId,
                    title: composeForm.title,
                    content: composeForm.content,
                    sentDate: Timestamp.fromDate(new Date())
                });

                const docSnap = await getDoc(docRef);
                if (!docSnap.exists())
                {
                    setOtherError("Missing added document");
                    throw new Error(otherError)
                }
                else
                {
                    router.push("/");
                }
            } catch (e) {
                console.error(otherError)
            }
        }
    }

    return(
        <div className="listContainer">
            <h2>Compose Message</h2>
            <div>
                <label>Receiver Id:</label>
                <input style={{ outlineStyle: 'solid'}} type="text" name="receiverId" onChange={handleChange} />
                {composeError.receiverId &&(
                    <div>{composeError.receiverId}</div>
                )}
            </div>
            <div>
                <label>Title:</label>
                <input style={{ outlineStyle: 'solid'}} type="text" name="title" onChange={handleChange} />
                {composeError.title &&(
                    <div>{composeError.title}</div>
                )}
            </div>
            <div>

                <label>Content:</label>
                <textarea style={{ outlineStyle: 'solid', width: '500px', height: '175px'}}
                       name="content" onChange={handleChange} />
                {composeError.content &&(
                    <div>{composeError.content}</div>
                )}
            </div>
            <button onClick={sendMessage}>
                Send Message
            </button>
        </div>
    )
}