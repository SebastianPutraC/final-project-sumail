'use client'
import Header from "@/components/header";
import ComposeForm from "@/components/composeForm";

export default function ComposePage() {
    return (
        <>
            <div>
                {Header()}
            </div>
            <div>
                {ComposeForm()}
            </div>
        </>
    );
}
