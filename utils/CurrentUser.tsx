import firebase from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

interface UserProps {
  id: string;
  email: string;
  name: string;
  password: string;
}

export function GetCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<UserProps>({
    id: "",
    email: "",
    name: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const reference = doc(firebase.db, "users", uid);
        const snapshot = await getDoc(reference);

        if (snapshot.exists()) {
          const userData = snapshot.data();
          setUser({
            id: uid,
            name: userData.name,
            email: userData.email,
            password: userData.password,
          });
        } else {
          console.log("User data not found");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebase.auth, firebase.db, router]);

  return { user, loading };
}
