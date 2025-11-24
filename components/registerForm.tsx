'use client'

import firebase from  "../firebase/firebaseConfig"
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface RegisterProps {
    email: string;
    name: string;
    password: string;
}

export default function RegisterForm()
{
    const router = useRouter();
    const [registerForm, setRegisterForm] = useState<RegisterProps>(
        {email: "", name: "", password: ""})
    const [registerError, setRegisterError] = useState<RegisterProps>(
        {email: "", name: "", password: ""})

    const [otherError, setOtherError] = useState();

    const handleChange =
        (event : React.ChangeEvent<HTMLInputElement>) => {

            setRegisterForm({...registerForm, [event.target.name]: event.target.value})
            setRegisterError({...registerError, [event.target.name]: ""})
        };

    const validateData = () => {
        const newErrors : RegisterProps =
            {email: "", name: "", password: ""};
        if (!registerForm.name) newErrors.name = "Name is required";
        if (!registerForm.email) newErrors.email = "Email is required";
        if (!registerForm.password) newErrors.password = "Password is required";

        return newErrors;
    }

    const registerUser = () => {
        const validationError = validateData();
        if(validationError.email !== "" && validationError.password !== ""
            && validationError.name !== "")
        {
            setRegisterError(validationError);
        }
        else
        {
            createUserWithEmailAndPassword(
                firebase.auth, registerForm.email, registerForm.password)
                .then(async (userCredential) =>
                {
                    const user = userCredential.user
                    await setDoc(doc(firebase.db, "users", user.uid),{
                        name: registerForm.name,
                        email: user.email,
                        password: registerForm.password,
                        joinedDate : serverTimestamp(),
                    })

                    signInWithEmailAndPassword(firebase.auth,
                        registerForm.email, registerForm.password)

                        .then(async () =>
                        {
                            router.push("/")
                        })
                        .catch((error) => {
                            setOtherError(error.message);
                        })
                })
                .catch((error) => {
                    setOtherError(error.message);
                })
        }
    }

    return(
        <div className="userForm">
            <h2>Register</h2>
            <div>
                <label>Name:</label>
                <input style={{ outlineStyle: 'solid'}} type="text" name="name" onChange={handleChange} />
                {registerError.name &&(
                    <div>{registerError.name}</div>
                )}
            </div>
            <div>
                <label>Email:</label>
                <input style={{ outlineStyle: 'solid'}} type="email" name="email" onChange={handleChange} />
                {registerError.email &&(
                    <div>{registerError.email}</div>
                )}
            </div>
            <div>

                <label>Password:</label>
                <input style={{ outlineStyle: 'solid'}} type="password" name="password" onChange={handleChange} />
                {registerError.password &&(
                    <div>{registerError.password}</div>
                )}
            </div>
            <button onClick={registerUser}>
                Register
            </button>
        </div>
    )
}