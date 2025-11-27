'use client'

import firebase from "../firebase/firebaseConfig"
import {addDoc, collection, Timestamp, getDocs} from "firebase/firestore";
import React, { useState, useEffect } from "react"; // 1. Import useEffect
import { useRouter, useSearchParams } from "next/navigation"; // 2. Import useSearchParams
import {GetCurrentUser} from "@/utils/CurrentUser";

interface ComposeProps {
    receiverEmail: string;
    title: string;
    content: string;
}

export default function ComposeForm()
{
    const router = useRouter();
    const searchParams = useSearchParams(); // 3. Initialize SearchParams
    const {user, loading} = GetCurrentUser();

    const [composeForm, setComposeForm] = useState<ComposeProps>(
        {receiverEmail: "", title: "", content: ""})
    const [composeError, setComposeError] = useState<ComposeProps>(
        {receiverEmail: "", title: "", content : ""})

    const [otherError, setOtherError] = useState("Unknown Error");

    // 4. ADD THIS: This reads the URL and fills the form
    useEffect(() => {
        const mode = searchParams.get('mode'); 
        const originalSender = searchParams.get('sender') || "";
        const originalTitle = searchParams.get('title') || "";
        const originalContent = searchParams.get('content') || "";

        if (mode === 'reply') {
            setComposeForm({
                receiverEmail: originalSender, 
                title: `Re: ${originalTitle}`,
                content: `\n\n\n--- Replying to message from ${originalSender} ---\n${originalContent}`
            });
        } else if (mode === 'forward') {
            setComposeForm({
                receiverEmail: "", // Forward leaves receiver empty
                title: `Fwd: ${originalTitle}`,
                content: `\n\n\n--- Forwarded message ---\n${originalContent}`
            });
        }
    }, [searchParams]);

    const handleChange =
        (event : React.ChangeEvent<HTMLInputElement> |
            React.ChangeEvent<HTMLTextAreaElement>) => {

            setComposeForm({...composeForm, [event.target.name]: event.target.value})
            setComposeError({...composeError, [event.target.name]: ""})
        };

    const validateData = () => {
        // ... (Keep your existing validation logic here) ...
        const newErrors : ComposeProps = {receiverEmail: "", title: "", content: ""};
        if (!composeForm.receiverEmail) newErrors.receiverEmail = "Receiver is required";
        if (!composeForm.title) newErrors.title = "Title is required";
        return newErrors;
    }

    const sendMessage = async () => {
        // ... (Keep your existing sendMessage logic here) ...
        // (Just copy paste your sendMessage function from previous code)
        
        // Quick summary of logic to ensure context isn't lost:
        const validationError = validateData();
        if (validationError.receiverEmail !== "" || validationError.title !== "") {
            setComposeError(validationError); return;
        }
        try {
            const userDocs = await getDocs(collection(firebase.db, "users"));
            const emailReceivers = composeForm.receiverEmail.split(";").map(email => email.trim());
            let receiverIds: string[] = [];
            for (const email of emailReceivers) {
                if(email === "") continue;
                const foundUserDoc = userDocs.docs.find(doc => doc.data().email === email);
                if (foundUserDoc) receiverIds.push(foundUserDoc.id);
            }
            if (receiverIds.length === 0) throw new Error("No valid receivers found.");

            await addDoc(collection(firebase.db, "messages"), {
                senderId: user.id,
                receiverId: receiverIds,
                title: composeForm.title,
                content: composeForm.content,
                sentDate: Timestamp.fromDate(new Date())
            });
            router.push("/");
        } catch (e: any) {
            setOtherError(e.message);
        }
    }

    return(
        <div className="listContainer">
            <h2>Compose Message</h2>
            <div>
                <label>Receiver Email:</label>
                {/* 5. CRITICAL FIX: Add 'value={composeForm.receiverEmail}' */}
                <input 
                    style={{ outlineStyle: 'solid'}} 
                    type="text" 
                    name="receiverEmail" 
                    value={composeForm.receiverEmail} 
                    onChange={handleChange} 
                />
                {composeError.receiverEmail &&(
                    <div>{composeError.receiverEmail}</div>
                )}
            </div>
            <div>
                <label>Title:</label>
                {/* 5. CRITICAL FIX: Add 'value={composeForm.title}' */}
                <input 
                    style={{ outlineStyle: 'solid'}} 
                    type="text" 
                    name="title" 
                    value={composeForm.title} 
                    onChange={handleChange} 
                />
                {composeError.title &&(
                    <div>{composeError.title}</div>
                )}
            </div>
            <div>
                <label>Content:</label>
                {/* 5. CRITICAL FIX: Add 'value={composeForm.content}' */}
                <textarea 
                    style={{ outlineStyle: 'solid', width: '500px', height: '175px'}}
                    name="content" 
                    value={composeForm.content} 
                    onChange={handleChange} 
                />
            </div>
            <button onClick={sendMessage}>
                Send Message
            </button>
        </div>
    )
}