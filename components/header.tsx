'use client'

import React from "react";
import {useRouter} from "next/navigation";

export default function Header()
{
    const router = useRouter();

    return(
            <div>
                <button onClick={() => router.push(`/`)}
                        className='buttonStyle'>Main</button>
                <button onClick={() => router.push(`/login`)}
                        className='buttonStyle'>Login</button>
                <button onClick={() => router.push(`/register`)}
                        className='buttonStyle'>Register</button>
            </div>
    )
}