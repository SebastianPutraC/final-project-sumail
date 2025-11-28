'use client'

import firebase from  "../firebase/firebaseConfig"
import {addDoc, collection, Timestamp, getDoc, doc} from "firebase/firestore";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {GetCurrentUser} from "@/utils/CurrentUser";
import { query, where, orderBy, limit, getDocs } from "firebase/firestore"

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

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false)

    const fetchSuggestions = async (keyword: string) => {
        if (!keyword || !user.id) {
            setSuggestions([]);
            return
        }

        const q = query(
            collection(firebase.db, "messages"),
            where("senderId", "==", user.id),
            orderBy("sentDate", "desc"),
            limit(10)
        );

        const querySnap = await getDocs(q);
        const receivers: Record<string, number> = {};

        querySnap.forEach(doc => {
            const r = doc.data().receiverId;
            if (r.toLowerCase().includes(keyword.toLowerCase())) {
                receivers[r] = (receivers[r] || 0) + 1;
            }
        });

        const sorted = Object.keys(receivers).sort(
            (a, b) => receivers[b] - receivers[a]
        );

        setSuggestions(sorted.slice(0, 5));
    }

    const handleChange =
        (event : React.ChangeEvent<HTMLInputElement> |
            React.ChangeEvent<HTMLTextAreaElement>) => {
            
            const { name, value } = event.target;    

            setComposeForm({...composeForm, [name]: value })
            setComposeError({...composeError, [name]: ""})

            if (name === "receiverId") {
                setShowSuggestions(true)
                fetchSuggestions(value)
            }
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
        if(validationError.receiverId || validationError.title || validationError.content)
        {
            setComposeError(validationError);
            return;
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
                <input style={{ outlineStyle: 'solid'}} type="text" name="receiverId" value={composeForm.receiverId} onChange={handleChange} onFocus={() => setShowSuggestions(true)} />

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="suggest-box">
                        {suggestions.map((item, i) => (
                            <li key={i} onClick={() => {
                                setComposeForm({ ...composeForm, receiverId: item })
                                setShowSuggestions(false)
                            }}
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                )}
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