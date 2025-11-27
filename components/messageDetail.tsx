'use client'

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import firebase from "../firebase/firebaseConfig"
import { useRouter } from "next/navigation"; // 1. Import useRouter

interface MessageProps {
    id: string;
    senderId: string;
    senderEmail?: string; // 2. Add this to store the fetched email
    receiverId: string;
    title: string;
    content: string;
    sentDate: string;
}

interface SlugProps {
    slug: string
}

export default function MessageDetail(slug: SlugProps) {
    const router = useRouter(); // 3. Initialize Router
    const [message, setMessage] = useState<MessageProps>();
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const getDetail = async () => {
            try {
                // 1. Fetch the Message
                const msgRef = doc(firebase.db, "messages", slug.slug);
                const msgSnapshot = await getDoc(msgRef);

                if (msgSnapshot.exists()) {
                    const msgData = msgSnapshot.data();
                    
                    // 2. Fetch the Sender's Email (Required for Reply functionality)
                    // We need the email address, not just the ID, to fill the input form
                    let senderEmail = "Unknown";
                    if (msgData.senderId) {
                        const userRef = doc(firebase.db, "users", msgData.senderId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            senderEmail = userSnap.data().email;
                        }
                    }

                    const formattedData: MessageProps = {
                        id: msgSnapshot.id,
                        title: msgData.title,
                        content: msgData.content,
                        senderId: msgData.senderId,
                        senderEmail: senderEmail, // Store the email
                        receiverId: msgData.receiverId,
                        sentDate: msgData.sentDate.toDate().toLocaleDateString()
                    };

                    setMessage(formattedData);
                } else {
                    setErrorMessage("No such document!");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setErrorMessage("Error loading message");
            }
        }
        
        if(slug.slug) {
            getDetail();
        }
    }, [slug]);

    const replyMessage = () => {
        if (!message) return;

        // Create URL parameters
        const params = new URLSearchParams({
            mode: 'reply',
            sender: message.senderEmail || "", // Pass the email we fetched
            title: message.title,
            content: message.content
        });

        // Navigate to Compose page with data
        router.push(`/user/compose?${params.toString()}`);
    }

    const forwardMessage = () => {
        if (!message) return;

        // Create URL parameters (No sender needed for forward)
        const params = new URLSearchParams({
            mode: 'forward',
            title: message.title,
            content: message.content
        });

        // Navigate to Compose page
        router.push(`/user/compose?${params.toString()}`);
    }

    return (
        <>
            <div className="listContainer">
                {errorMessage ? (
                    <p style={{ color: 'red' }}>{errorMessage}</p>
                ) : (
                    <div>
                        {/* Added Sender Email to display */}
                        <div>Sender = {message && message.senderEmail} ({message && message.senderId})</div>
                        <div>Title = {message && message.title}</div>
                        <div>Content = {message && message.content}</div>
                        <div>Created At = {message && message.sentDate}</div>
                        
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button onClick={replyMessage}>
                                Reply
                            </button>
                            <button onClick={forwardMessage}>
                                Forward
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}