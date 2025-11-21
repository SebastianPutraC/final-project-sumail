'use client'
import firebase from  "../firebase/firebaseConfig"
import { signOut } from 'firebase/auth';
import { useRouter } from "next/navigation";
import { GetCurrentUser } from "@/utils/CurrentUser";
import Header from "@/components/header";
import {MessageList} from "@/components/messageList";

export default function Main()
{
    const router = useRouter();
    const {user, loading} = GetCurrentUser();

    const logoutUser = async () => {
        await signOut(firebase.auth);
    }

    const isLogged = user.email !== "" && !loading;

    return (
        <>
            <div>
                {Header()}
            </div>
            <div>
                <label>Main Page</label>
                <div>
                    <label>Welcome to main page {user.name}</label>
                    <br></br>
                    <label>Your email is {user.email}</label>
                </div>
            </div>
            <div>
                {MessageList(user)}
            </div>
        </>
    );
}
