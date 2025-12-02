"use client";
import Header from "@/components/Header";
import ComposeForm from "@/components/ComposeForm";

export default function ComposePage() {
  return (
    <>
      <div>{Header()}</div>
      <ComposeForm></ComposeForm>
    </>
  );
}
