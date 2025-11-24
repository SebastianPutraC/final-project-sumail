'use client'

import firebase from  "../firebase/firebaseConfig"
import {addDoc, collection, Timestamp, getDoc, doc, getDocs} from "firebase/firestore";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {GetCurrentUser} from "@/utils/CurrentUser";

interface ComposeProps {
    receiverEmail: string;
    title: string;
    content: string;
}

export default function ComposeForm()
{
    const router = useRouter();
    const [composeForm, setComposeForm] = useState<ComposeProps>(
        {receiverEmail: "", title: "", content: ""})
    const [composeError, setComposeError] = useState<ComposeProps>(
        {receiverEmail: "", title: "", content : ""})
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
            {receiverEmail: "", title: "", content: ""};
        if (!composeForm.receiverEmail) newErrors.receiverEmail = "Receiver is required";
        if (!composeForm.title) newErrors.title = "Title is required";

        return newErrors;
    }

    const sendMessage = async () => {
        const validationError = validateData();
        if(validationError.receiverEmail !== "" && validationError.title !== "")
        {
            setComposeError(validationError);
        }
        else
        {
            try {
                const userDocs =
                    await getDocs(collection(firebase.db, "users"));
                const emailDocs = (userDocs.docs.map((doc) => doc.data().email));
                const receiverIndex  = emailDocs.
                    findIndex(receiver => receiver === composeForm.receiverEmail)

                if (receiverIndex === -1) {
                    setOtherError("No receiver email");
                    throw new Error(otherError)
                }

                const receiverId = userDocs.docs[receiverIndex].id;

                const receiverRef = doc(firebase.db, "users", receiverId)
                const receiverSnap = await getDoc(receiverRef)
                if (!receiverSnap.exists() || receiverSnap.id === user.id)
                {
                    setOtherError("No available receiver");
                    throw new Error(otherError)
                }

                const docRef = await addDoc(collection
                (firebase.db, "messages"), {
                    senderId: user.id,
                    receiverId: receiverId,
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
                <label>Receiver Email:</label>
                <input style={{ outlineStyle: 'solid'}} type="text" name="receiverEmail" onChange={handleChange} />
                {composeError.receiverEmail &&(
                    <div>{composeError.receiverEmail}</div>
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
            </div>
            <button onClick={sendMessage}>
                Send Message
            </button>
        </div>
    )
}