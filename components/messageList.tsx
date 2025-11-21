'use client'

import firebase from  "../firebase/firebaseConfig"
import {useState, useEffect} from "react";
import {onSnapshot, collection} from "firebase/firestore";
import {useRouter} from "next/navigation";

interface MessageProps {
    id: string;
    senderId: string;
    receiverId: string;
    title: string;
    content: string;
    sentDate: string;
}

export function MessageList (user:  {
    id : string
    email: string
    name: string
    password: string })
{
    const router = useRouter();

    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const filterMessage = (messages: MessageProps[], receiveId : string) =>
    {
        return messages.filter(item => item.receiverId === receiveId);
    }

    useEffect( () => {
        console.log("TEST");
        onSnapshot(collection(firebase.db, "messages"), (snapshot) => {
            const messageArray =
                snapshot.docs.map((document) => {

                return{
                    id: document.id,
                    senderId: document.data().senderId,
                    receiverId: document.data().receiverId,
                    title: document.data().title,
                    content: document.data().content,
                    sentDate: document.data().sentDate.toDate().toLocaleDateString()};
            });

            setMessages(filterMessage(messageArray, user.id));

        }, error => {
            setErrorMessage(error.message);
            console.log(error)
        });
    }, [user.id]);

    const viewDetail= (postsId : string) =>{
        router.push(`/posts/${postsId}`)
    }

    return(
        <>
            <div className="listContainer">
                <table>
                    <thead>
                    <tr>
                        <th>Sender Id</th>
                        <th>Title</th>
                        <th>Sent Date</th>
                        <th>Details Button</th>
                    </tr>
                    </thead>
                    <tbody>
                    {messages.map(message=> (
                        <tr key={message.id}>
                            <td>{message.senderId}</td>
                            <td>{message.title}</td>
                            <td>{message.sentDate}</td>
                            <td>
                                <button onClick={() => viewDetail(message.id)}>
                                    Message Details
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
