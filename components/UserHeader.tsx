import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Link from "next/link";

export default function UserHeader() {
  return (
    <div className="pt-8 pr-8 w-full h-fit flex justify-between">
      {/* Icon */}
      <Link href="/mail/inbox">
      <h1 className="font-pixelify text-4xl tracking-wide text-[#03045E] drop-shadow-sm">
        SUmail
      </h1>
      </Link>
      <AccountCircleIcon className="w-10! h-10! text-[#03045E]" />
    </div>
  );
}
