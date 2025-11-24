'use client'

import React from "react";
import {useRouter} from "next/navigation";
import {GetCurrentUser} from "@/utils/CurrentUser";

export default function Header()
{
    const {user, loading} = GetCurrentUser();
    const router = useRouter();

    return(
            <div>
                <button onClick={() => router.push(`/`)}
                        className='buttonStyle'>Main</button>
                <button onClick={() => router.push(`/login`)}
                        className='buttonStyle'>Login</button>
                <button onClick={() => router.push(`/register`)}
                        className='buttonStyle'>Register</button>
                <button onClick={() => router.push(`/user/compose`)}
                        className='buttonStyle'>Compose</button>
                <button onClick={() => router.push(`/user/profile/${user.id}`)}
                        className='buttonStyle'>Profile</button>
            </div>
    )
}