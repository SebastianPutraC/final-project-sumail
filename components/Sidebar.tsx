"use client";

import Link from "next/link";
import MenuIcon from "@mui/icons-material/Menu";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { usePathname } from "next/navigation";
import { SidebarLinkProps } from "@/utils/types";

export default function Sidebar() {
  const pathname = usePathname();
  const compose = pathname.includes("compose");
  const inbox = pathname.includes("inbox");
  const starred = pathname.includes("starred");
  const sent = pathname.includes("sent");

  const sidebarArr = [
    { checkPath: compose, Icon: CreateOutlinedIcon, path: "compose" },
    { checkPath: inbox, Icon: InboxOutlinedIcon, path: "inbox" },
    { checkPath: starred, Icon: StarBorderOutlinedIcon, path: "starred" },
    { checkPath: sent, Icon: SendOutlinedIcon, path: "sent" },
  ];

  return (
    <aside className="p-8 flex flex-col items-center gap-10">
      {/* Burger */}
      <MenuIcon className="w-9! h-9! -ml-1" />
      {/* Content */}
      <nav className="flex flex-col gap-5 text-center">
        {sidebarArr.map((item, i) => (
          <SidebarLink
            key={i}
            checkPath={item.checkPath}
            Icon={item.Icon}
            path={item.path}
          />
        ))}
      </nav>
    </aside>
  );
}

const SidebarLink = ({ checkPath, Icon, path }: SidebarLinkProps) => {
  return (
    <Link
      href={`/mail/${path}`}
      onClick={(e) => checkPath && e.preventDefault()}
      className={`w-fit p-2 rounded-lg group hover:bg-[#03045E] ${
        checkPath ? "bg-[#03045E] hover:bg-[#0077B6]!" : ""
      }`}
    >
      <Icon
        className={`w-7! h-7! text-[#03045E] group-hover:text-white ${
          checkPath ? "text-white" : ""
        }`}
      />
    </Link>
  );
};
