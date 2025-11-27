'use client'

import {useEffect, useState} from "react";
import {doc, getDoc} from "firebase/firestore";
import firebase from "../firebase/firebaseConfig"

interface MessageProps {
    id: string;
    senderId: string;
    receiverId: string;
    title: string;
    content: string;
    sentDate: string;
}

interface SlugProps{
    slug : string
}

export default function MessageDetail(slug : SlugProps)
{
    const [message, setMessage] = useState<MessageProps>();
    const [errorMessage, setErrorMessage] = useState("");

    useEffect( () => {
        const getDetail = async () =>
        {
            const reference = doc(firebase.db, "messages", slug.slug)
            const snapshot = await getDoc(reference)
            if (snapshot.exists())
            {
                const data : MessageProps =
                    {id: snapshot.id,
                        title: snapshot.data().title,
                        content: snapshot.data().content,
                    senderId : snapshot.data().senderId,
                    receiverId : snapshot.data().receiverId,
                    sentDate : snapshot.data().sentDate.toDate().toLocaleDateString()};

                setMessage(data);
            }
            else
            {
                setErrorMessage("No such document!")
            }
        }
        getDetail()
    }, [slug]);

    return(
        <>
            <div>
                    <div>Sender = {message && message.senderId}</div>
                    <div>Title = {message && message.title}</div>
                    <div>Content = {message && message.content}</div>
                    <div>Created At = {message && message.sentDate}</div>
            </div>
        </>
    )
}