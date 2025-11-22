'use client'

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import firebase from  "../firebase/firebaseConfig"
import { useRouter } from "next/navigation";

interface LoginProps {
    email: string;
    password: string;
}

export default function LoginForm () {
    const router = useRouter()
    const [loginForm, setForm] = useState<LoginProps>({email: "", password: ""})
    const [loginError, setLoginError] = useState<LoginProps>({email: "", password: ""});

    const [otherError, setOtherError] = useState();

    const handleChange =
        (event : React.ChangeEvent<HTMLInputElement>) => {

        setForm({...loginForm, [event.target.name]: event.target.value})
        setLoginError({...loginError, [event.target.name]: ""})
    };

    const validateData = () => {
        const newErrors : LoginProps = {email: "", password: ""};
        if (!loginForm.email) newErrors.email = "Email is required";
        if (!loginForm.password) newErrors.password = "Password is required";

        return newErrors;
    }

    const loginUser = () => {
        const validationError = validateData();
        if(validationError.email !== "" && validationError.password !== "")
        {
            setLoginError(validationError);
        }
        else
        {
            signInWithEmailAndPassword(firebase.auth, loginForm.email, loginForm.password)
                .then(async () =>
                {
                    router.push("/")
                })
                .catch((error) => {
                    setOtherError(error.message);
                })
        }
    }

    return (
        <>
            <div className="userForm">
                <h2>Login Page</h2>
                <div>
                    <label>Email:</label>
                    <input style={{ outlineStyle: 'solid'}} type="email" name="email"
                           onChange={handleChange}/>
                    {loginError.email &&(
                        <div>{loginError.email}</div>
                    )}
                </div>
                <div>
                    <label>Password:</label>
                    <input style={{ outlineStyle: 'solid'}} type="password" name="password"
                        onChange={handleChange}/>
                    {loginError.password &&(
                        <div>{loginError.password}</div>
                        )}
                </div>
                <button onClick={loginUser}>
                    Login
                </button>
            </div>
        </>
    )
}