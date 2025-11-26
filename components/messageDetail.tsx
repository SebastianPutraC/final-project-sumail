'use client'

import {useEffect, useState} from "react";
import {arrayRemove, arrayUnion, doc, getDoc, updateDoc} from "firebase/firestore";
import firebase from "../firebase/firebaseConfig"
import { GetCurrentUser } from "../utils/CurrentUser"
import { useRouter } from "next/navigation";

interface MessageProps {
    id : string;
    senderName: string;
    senderEmail: string;
    title: string;
    content: string;
    sentDate: string;
    starred: boolean;
}

interface SlugProps{
    slug : string
}

export default function MessageDetail(slug : SlugProps)
{
    const router  = useRouter();
    const [message, setMessage] = useState<MessageProps>();
    const { user, loading } = GetCurrentUser();
    
    useEffect( () => {
        const getDetail = async () =>
        {
            try {
                console.log("Get Detail")
                const reference = doc(firebase.db, "messages", slug.slug)
                const snapshot = await getDoc(reference)
                if (snapshot.exists())
                {
                    const data : MessageProps =
                        {   id : snapshot.id,
                            title: snapshot.data().title,
                            content: snapshot.data().content,
                            senderName: "",
                            senderEmail: "",
                            sentDate : snapshot.data().sentDate.toDate().toLocaleDateString(),
                            starred : snapshot.data().starredId?.includes(user.id)}

                    const senderRef = doc(firebase.db, "users", snapshot.data().senderId)
                    const senderSnap = await getDoc(senderRef)
                    if (senderSnap.exists()) {
                        data.senderName = senderSnap.data().name;
                        data.senderEmail = senderSnap.data().email;
                    }
                    else {
                        throw new Error("Sender data not found")
                    }
                    setMessage(data);
                }
                else {
                    throw new Error("Message data not found")
                }
            }
            catch (error) {
                console.error(error)
            }
        }
        getDetail()
    }, [slug, user.id]);

    async function handleDelete(documentId : string)
    {
        try {
                const docRef = doc(firebase.db, "messages", documentId);
                const docInfo = await getDoc(docRef)

                if (!docInfo.exists()) {
                    throw new Error("No Message Found")
                }
                else {
                    if (docInfo.data().receiverId.includes(user.id)) {
                        await updateDoc(docRef, {
                            receiverId: arrayRemove(user.id)
                        });
                        router.push('/');
                    }
                    else {
                        throw new Error(`Message already can't be read by user`);
                    }
                }
                
        } catch (error) {
            console.error("Error deleting message: ", error);
        }
    }
    async function handleStar(documentId : string)
    {
        try {
            const docRef = doc(firebase.db, "messages", documentId);
            const docInfo = await getDoc(docRef)

            if (!docInfo.exists()) {
                throw new Error("No Message Found")
            }
            else {
                const starredArray : string[] = docInfo.data().starredId;
                if (starredArray.includes(user.id)) {
                    await updateDoc(docRef, {
                        starredId: arrayRemove(user.id)
                    });
                }
                else {
                    await updateDoc(docRef, {
                        starredId: arrayUnion(user.id)
                    });
                }
                router.refresh()
            }
        } catch (error) {
            console.error("Error starring message: ", error);
        }
    }

    return(
        <>
            <div>
                <div>Sender = {message && message.senderName}</div>
                <div>Sender Email = {message && message.senderEmail} </div>
                <div>Title = {message && message.title}</div>
                <div>Content = {message && message.content}</div>
                <div>Created At = {message && message.sentDate}</div>
            </div>
            <div>
                {message && <button onClick={() => handleStar(message?.id)}>
                    {(message?.starred) ? (
                        <p>Unstar Message</p>
                    ) : (
                        <p>Star Message</p>
                    )}
                </button>}

                {message && <button onClick={() => handleDelete(message?.id)}>
                    Delete Message</button>}

            </div>
        </>
    )
}