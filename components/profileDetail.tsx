'use client'

import React, {useEffect, useRef, useState} from "react";
import {doc, getDoc, updateDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import firebase from "../firebase/firebaseConfig"
import { useRouter } from "next/navigation";
import {signOut} from "firebase/auth";

interface UserProps {
    id : string;
    email: string;
    name: string;
    joinedDate : string;
    profilePicture: string;
}

interface SlugProps{
    slug : string
}

export default function ProfileDetail(slug : SlugProps)
{
    const router = useRouter();
    const [user, setUser] = useState<UserProps>();

    const profilePicRef = useRef<HTMLImageElement>(null);
    const [profilePic, setProfilePic] = useState<File | null>(null)

    const [newName, setNewName] = useState("");

    const handleFileChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setProfilePic(event.target.files[0]);
        }
    };
    function getFileExtension(filename : string) {
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === 0) {
            return '';
        }
        return filename.substring(lastDotIndex + 1);
    }

    function logoutModal() {
        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            logoutUser();
        }
    }

    const handleUpload = async () => {
        if (!profilePic) return;

        const storageRef = ref(firebase.storage, `profile-pictures/${user?.id}`);

        try {
            const imageExtension = getFileExtension(profilePic.name);
            const supportedExtensions: string[] = ["jpg", "png", 'jpeg', 'jfif', 'pjpeg', 'pjp', 'svg', 'webp'];
            if (!supportedExtensions.includes(imageExtension)) {
                throw new Error("File type not supported")
            }

            await uploadBytes(storageRef, profilePic);
            const pictureUrl = await getDownloadURL(storageRef);

            if (!user || !pictureUrl) {
               throw new Error("No user or picture provided");
            }

            await updateDoc(doc(firebase.db, "users", user.id), {
                profilePicture : user.id
            });
            router.refresh();

        } catch (error) {
            console.error('Error uploading picture', error);
        }
    };

    const handleNameInputChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        setNewName(event.target.value);
    };

    const handleNameChange = async () => {
        try {
            if (user) {
                await updateDoc(doc(firebase.db, "users", user.id), {
                    name : newName
                });
                router.refresh();
            }
        }
        catch (error) {
            console.error('Error changing name ', error);
        }
    }

    const logoutUser = async () => {
        await signOut(firebase.auth);
    }

    useEffect( () => {
        const getDetail = async () =>
        {
            const reference = doc(firebase.db, "users", slug.slug)
            const snapshot = await getDoc(reference)
            if (snapshot.exists())
            {
                const data : UserProps =
                    {
                        id: snapshot.id,
                        name: snapshot.data().name,
                        email: snapshot.data().email,
                        joinedDate: snapshot.data()?.createdAt ? snapshot.data().createdAt.toDate().toLocaleDateString() : "Unknown",
                        profilePicture: snapshot.data().profilePicture,
                    }

                setUser(data);
                let storageRef = null;

                if (data.profilePicture == "" || data.profilePicture == null) {
                    storageRef = ref(firebase.storage, `profile-pictures/default.png`);
                }
                else {
                    storageRef = ref(firebase.storage, `profile-pictures/${data.profilePicture}`);
                }
                const pictureUrl = await getDownloadURL(storageRef);

                if (profilePicRef.current) {
                    profilePicRef.current.src = pictureUrl;
                }
            }
            else
            {
                throw new Error("Can't user info")
            }
        }
        getDetail()
    }, [slug]);

    return(
        <>
            <div>
                <div className="flex flex-col items-center">
                    <img width='150px' height='150px' ref={profilePicRef} className="rounded-full border-2 border-[#00B4D8] mb-4" alt="Profile Picture"></img>
                    <p className="font-bold text-xl">Welcome, {user && user.name}</p>
                </div>
                <div className="border-[#00B4D8] border-2 rounded-lg py-4 px-20 my-4 w-[60vw] text-lg">
                    <h3 className="text-xl font-bold">Basic Info</h3>
                    <div className="flex flex-row my-2">
                        <div className="flex-1">
                            Name
                        </div>
                        <div className="flex-1">
                            {user && user.name}
                        </div>
                    </div>
                    <div className="flex flex-row my-2">
                        <div className="flex-1">
                            Email
                        </div>
                        <div className="flex-1">
                            {user && user.email}
                        </div>
                    </div>
                    <div className="flex flex-row my-2">
                        <div className="flex-1">
                            Joined Date
                        </div>
                        <div className="flex-1">
                            {user && user.joinedDate}
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-[#00B4D8] border-2 rounded-lg py-4 px-20 my-4 w-[60vw] text-lg">
                <div className="flex flex-row my-2 items-center">
                    <div className="flex-1">
                        <input type="file" onChange={handleFileChange} />
                    </div>
                    <div className="flex-1">
                        <button className="border-2 border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white font-semibold rounded-lg p-3 w-full max-w-xs transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer" onClick={handleUpload}>
                            Upload Profile Picture
                        </button>
                    </div>
                </div>
                
                
                <hr></hr>
                <div className="flex flex-row my-2 items-center">
                    <div className="flex-1">
                        <input style={{ outlineStyle: 'solid'}} type="text" name="newName" onChange={handleNameInputChange} placeholder="New Name"/>
                    </div>
                    <div className="flex-1">
                        <button className="border-2 border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white font-semibold rounded-lg p-3 w-full max-w-xs transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer" onClick={handleNameChange}>Change Name</button>
                    </div>       
                </div>
                

                
            </div>
            <button className="border-2 border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white font-semibold rounded-lg p-3 w-full max-w-xs transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer" onClick={logoutModal}>Logout</button>
        </>
    )
}