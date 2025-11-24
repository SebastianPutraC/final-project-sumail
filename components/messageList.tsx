'use client'

import firebase from  "../firebase/firebaseConfig"
import {useState, useEffect} from "react";
import {onSnapshot, collection, updateDoc, getDoc} from "firebase/firestore";
import {useRouter} from "next/navigation";
import { doc } from "firebase/firestore";

interface MessageProps {
    id: string;
    senderId: string;
    receiverId: string;
    title: string;
    content: string;
    sentDate: Date;
    isReceiverStar : boolean;
    isSenderStar : boolean;
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
    const [type, setType] = useState(0);

    const sortFilterMessage = (messages: MessageProps[], receiveId : string, senderId : string, categoryType : number) =>
    {
        let filteredMessage = messages
        switch (categoryType)
        {
            case 0: //Receive
                filteredMessage = messages.filter(item => item.receiverId === receiveId);
                filteredMessage.sort((a, b) =>
                {
                    if (a.isReceiverStar !== b.isReceiverStar) {
                        return a.isReceiverStar ? -1 : 1;
                    }
                    return b.sentDate.getDate() - a.sentDate.getDate()
                });
                break;
            case 1: //Sent
                filteredMessage = messages.filter(item => item.senderId === senderId);
                filteredMessage.sort((a, b) =>
                {
                    if (a.isSenderStar !== b.isSenderStar) {
                        return a.isSenderStar ? -1 : 1;
                    }
                    return b.sentDate.getDate() - a.sentDate.getDate()
                });
                break;
            case 2: //Starred
                filteredMessage = messages.filter(item => (
                    ((item.receiverId === receiveId && item.isReceiverStar)
                        || item.senderId === senderId && item.isSenderStar)));
                filteredMessage.sort((a, b) =>
                {
                    return b.sentDate.getDate() - a.sentDate.getDate()
                });
                break;
            default:
                break;
        }
        return filteredMessage;
    }

    useEffect( () => {
        onSnapshot(collection(firebase.db, "messages"), (snapshot) => {
            const messageArray =
                snapshot.docs.map((document) => {

                return {
                    id: document.id,
                    senderId: document.data().senderId,
                    receiverId: document.data().receiverId,
                    title: document.data().title,
                    content: document.data().content,
                    sentDate: document.data().sentDate.toDate(),
                    isSenderStar: document.data().isSenderStar,
                    isReceiverStar: document.data().isReceiverStar,
                }
            });

            setMessages(sortFilterMessage(messageArray, user.id, user.id, type));

        }, error => {
            setErrorMessage(error.message);
            console.log(error)
        });
    }, [type, user.id]);

    const viewDetail= (messageId : string) =>{
        router.push(`/user/message/${messageId}`)
    }

    async function handleStar(documentId : string,  categoryType : number)
    {
        const docRef = doc(firebase.db, "messages", documentId);
        try {
            const docInfo = await getDoc(docRef)

            if (!docInfo.exists())
            {
                throw new Error("No Message Found")
            }
            else
            {
                switch (categoryType)
                {
                    case 0: //Receive
                        if (docInfo.data().isReceiverStar)
                            await updateDoc(docRef, { isReceiverStar : false});
                        else
                            await updateDoc(docRef, { isReceiverStar : true});
                        break;
                    case 1: //Sent
                        if (docInfo.data().isSenderStar)
                            await updateDoc(docRef, { isSenderStar : false});
                        else
                            await updateDoc(docRef, { isSenderStar : true});
                        break;
                    case 2: //Starred
                        if (docInfo.data().receiverId === user.id)
                        {
                            if (docInfo.data().isReceiverStar)
                                await updateDoc(docRef, { isReceiverStar : false});
                            else
                                await updateDoc(docRef, { isReceiverStar : true});
                            break;
                        }
                        else if (docInfo.data().senderId === user.id)
                        {
                            if (docInfo.data().isSenderStar)
                                await updateDoc(docRef, { isSenderStar : false});
                            else
                                await updateDoc(docRef, { isSenderStar : true});
                            break;
                        }
                    default:
                        break;
                }
            }
            console.log("Document successfully updated!");

        } catch (error) {
            console.error("Error updating document: ", error);
        }
    }

    return(
        <>
            <div>
                <button onClick= {() => setType(0)}>Inbox</button>
                <button onClick={() => setType(1)}>Sent</button>
                <button onClick={() => setType(2)}>Starred</button>
            </div>
            <div className="listContainer">
                <table>
                    <thead>
                    <tr>
                        <th>Sender Id</th>
                        <th>Title</th>
                        <th>Sent Date</th>
                        <th>Details Button</th>
                        <th>Starred Button</th>
                    </tr>
                    </thead>
                    <tbody>
                    {messages.map(message=> (
                        <tr key={message.id}>
                            <td>{message.senderId}</td>
                            <td>{message.title}</td>
                            <td>{message.sentDate.toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => viewDetail(message.id)}>
                                    Message Details
                                </button>
                            </td>
                            <td>
                                <button onClick={() => handleStar(message.id, type)}>
                                    {(message.receiverId === user.id && message.isReceiverStar)
                                        || message.senderId === user.id && message.isSenderStar ? (
                                        <p>Unstar Message</p>
                                    ) : (
                                        <p>Star Message</p>
                                    )}
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
