'use client'
import Header from "@/components/Header";
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
