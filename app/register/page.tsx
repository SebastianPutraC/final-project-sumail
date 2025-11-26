'use client'
import RegisterForm from "@/components/registerForm";
import Header from "@/components/Header";

export default function RegisterPage() {
    return (
        <>
            <div>
                {Header()}
            </div>
            <div>
                Register
                {RegisterForm()}
            </div>
        </>
    );
}
