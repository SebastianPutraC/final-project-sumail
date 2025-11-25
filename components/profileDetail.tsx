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

    const handleUpload = async () => {
        if (!profilePic) return;

        const storageRef = ref(firebase.storage, `profile-pictures/${user?.id}`);

        try {
            const imageExtension = getFileExtension(profilePic.name);

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
                        joinedDate: snapshot.data().joinedDate.toDate().toLocaleDateString(),
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
                <div>
                    <label>Profile Pic</label>
                    <img width='150px' height='150px' ref={profilePicRef}></img>
                </div>
                <div>Name = {user && user.name}</div>
                <div>Email = {user && user.email}</div>
                <div>Joined Date = {user && user.joinedDate}</div>
            </div>
            <div>
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleUpload}>
                    Upload Profile Picture
                </button>
                <br></br>
                <input style={{ outlineStyle: 'solid'}}
                       type="text" name="newName" onChange={handleNameInputChange} />
                <button onClick={handleNameChange}>
                    Change Name
                </button>
                <br></br>
                <button onClick={logoutUser}>Logout</button>
            </div>
        </>
    )
}