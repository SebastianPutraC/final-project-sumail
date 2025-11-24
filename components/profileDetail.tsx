'use client'

import {useEffect, useState} from "react";
import {doc, getDoc} from "firebase/firestore";
import firebase from "../firebase/firebaseConfig"

interface UserProps {
    id : string;
    email: string;
    name: string;
    joinedDate : string;
}

interface SlugProps{
    slug : string
}

export default function ProfileDetail(slug : SlugProps)
{
    const [user, setUser] = useState<UserProps>();
    const [errorMessage, setErrorMessage] = useState("");

    useEffect( () => {
        const getDetail = async () =>
        {
            const reference = doc(firebase.db, "users", slug.slug)
            const snapshot = await getDoc(reference)
            if (snapshot.exists())
            {
                const data : UserProps =
                    {
                        id: snapshot.id,
                        name: snapshot.data().name,
                        email: snapshot.data().email,
                        joinedDate: snapshot.data().joinedDate.toDate().toLocaleDateString(),
                    }

                setUser(data);
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
                <div>Name = {user && user.name}</div>
                <div>Email = {user && user.email}</div>
                <div>Joined Date = {user && user.joinedDate}</div>
            </div>
        </>
    )
}