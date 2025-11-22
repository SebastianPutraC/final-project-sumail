'use client'
import LoginForm from "@/components/loginForm";
import Header from "@/components/header";

export default function LoginPage() {
    return (
        <>
            <div>
                {Header()}
            </div>
            <div>
                Login
                {LoginForm()}
            </div>
        </>
    );
}
