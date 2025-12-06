'use client'
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Link from "next/link";
import { GetCurrentUser } from "@/utils/CurrentUser";

export default function UserHeader() {
    const { user } = GetCurrentUser();

    return (
    <div className="pt-8 pr-8 w-full h-fit flex justify-between">
      {/* Icon */}
      <Link href="/mail/inbox">
      <h1 className="font-pixelify text-4xl tracking-wide text-[#03045E] drop-shadow-sm">
        SUmail
      </h1>
      </Link>
        <Link href={`/user/profile/${user.id}`} className={``}>
            <AccountCircleIcon className="w-15! h-15! p-1.5 text-[#03045E]
            rounded-lg group hover:bg-[#03045E] hover:text-[#FFFFFF]"  />
        </Link>
    </div>
  );
}
