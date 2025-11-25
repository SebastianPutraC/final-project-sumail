'use client'

import firebase from  "../firebase/firebaseConfig"
import {useState, useEffect, ChangeEvent} from "react";
import {onSnapshot, collection, updateDoc, getDoc, arrayUnion, arrayRemove} from "firebase/firestore";
import {useRouter} from "next/navigation";
import { doc } from "firebase/firestore";

interface MessageProps {
    id: string;
    senderId: string;
    receiverId: string;
    title: string;
    content: string;
    sentDate: Date;
    starred: boolean;
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
    const [checkedCheckboxes, setCheckedCheckboxes] = useState<string[]>([]);

    const sortFilterMessage = (messages: MessageProps[], receiveId : string, senderId : string, categoryType : number) =>
    {
        let filteredMessage = messages
        switch (categoryType)
        {
            case 0: //Receive
                filteredMessage = messages.filter(item => item.receiverId === receiveId);

                filteredMessage.sort((a, b) =>
                {
                    if (a.starred !== b.starred) {
                        return a.starred ? -1 : 1;
                    }
                    return b.sentDate.getDate() - a.sentDate.getDate()
                });
                break;
            case 1: //Sent
                filteredMessage = messages.filter(item => item.senderId === senderId);
                filteredMessage.sort((a, b) =>
                {
                    if (a.starred !== b.starred) {
                        return a.starred ? -1 : 1;
                    }
                    return b.sentDate.getDate() - a.sentDate.getDate()
                });
                break;
            case 2: //Starred
                filteredMessage = messages.filter(item =>
                    (item.receiverId === receiveId || item.senderId === senderId) && item.starred);
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
                    starred : document.data().starredId?.includes(user.id),
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

    async function handleStar(documentId : string[])
    {
        try {
            for (let i = 0; i < documentId.length; i++)
            {
                const docRef = doc(firebase.db, "messages", documentId[i]);
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
                }
                console.log(`Document successfully updated! : ${documentId[i]}`);
            }
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    }

    const handleCheckboxChange = (event : ChangeEvent<HTMLInputElement>) => {
        const checkedId = event.target.value;
        if(event.target.checked){
            setCheckedCheckboxes([...checkedCheckboxes, checkedId])
        }else{
            setCheckedCheckboxes(checkedCheckboxes.filter(id=>id !== checkedId))
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
                        <th>Checkbox</th>
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
                            <td>
                                <input
                                    type="checkbox" value={message.id} checked={checkedCheckboxes.includes(message.id)}
                                    onChange={(event) => { handleCheckboxChange(event) }}
                                />
                            </td>
                            <td>{message.senderId}</td>
                            <td>{message.title}</td>
                            <td>{message.sentDate.toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => viewDetail(message.id)}>
                                    Message Details
                                </button>
                            </td>
                            <td>
                                <button onClick={() => handleStar([message.id])}>
                                    {(message.starred) ? (
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
                <button onClick={() => handleStar(checkedCheckboxes)}>
                    Star All Selected
                </button>
            </div>
        </>
    )
}
