"use client";

import firebase from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { loginSchema } from "@/validation/loginRegisterSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import { AuthPayload } from "@/utils/types";
import { FirebaseError } from "firebase/app";

export default function Login() {
  // Package Implementation
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AuthPayload>({
    resolver: yupResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // State Management
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function onSubmit(data: AuthPayload) {
    const domainEmail = "@sumail.com";
    try {
      setIsLoading(true);

      await signInWithEmailAndPassword(
        firebase.auth,
        data.email + domainEmail,
        data.password
      );

      toast.success("Login success! You will be redirect to home page");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/invalid-credential") {
          toast.error("Wrong email or password");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className={`flex min-h-dvh items-center justify-center ${
        isLoading && "pointer-events-none"
      }`}
    >
      <div className="flex">
        <div className="flex justify-center">
          {/* Header */}
          <header className="flex flex-col gap-8 bg-white items-center justify-center w-[400px] rounded-xl h-full">
            <div className="text-center items-center flex flex-col gap-2">
              <MailOutlineIcon className="w-20! h-20! text-[#00B4D8]" />
              <h1 className="font-pixelify text-7xl tracking-wide text-[#0077B6] drop-shadow-sm">
                Sumail
              </h1>
              <p className="text-lg text-gray-700">Welcome to Sumail</p>
              <p className="text-base text-gray-500 -mt-2">
                Best email web for your needs
              </p>
            </div>

            <div className="text-center flex flex-col gap-3">
              <p className="text-gray-700">Doesn&apos;t have an account yet?</p>
              <button
                className="border-2 border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white font-semibold rounded-lg p-3 w-full max-w-xs mx-auto transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                onClick={() => router.push("/register")}
              >
                Register
              </button>
            </div>
          </header>
        </div>

        {/* Content */}
        <form
          className="p-8 rounded-2xl flex flex-col gap-7"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Form Title */}
          <div className="text-center flex flex-col gap-1">
            <h2 className="font-pixelify text-5xl">Login</h2>
            <p className="text-lg text-gray-600">Enter your information</p>
          </div>

          {/* Form Content */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Email</label>
              <div className="flex gap-3">
                <input
                  {...register("email")}
                  type="text"
                  placeholder="ex. andrew"
                  className="bg-white border border-[#90E0EF] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition"
                />
                <input
                  disabled
                  value="@sumail.com"
                  className="bg-gray-200 text-gray-500 rounded-lg p-3"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="Password must be at least 8 characters"
                className="bg-white border border-[#90E0EF] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="flex items-center justify-center bg-[#00B4D8] hover:bg-[#0096C7] font-semibold text-white rounded-lg p-3 w-full text-lg transition shadow-sm hover:shadow-md cursor-pointer disabled:cursor-auto disabled:bg-gray-300"
          >
            {isLoading ? <ClipLoader size={25} color="white" /> : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
