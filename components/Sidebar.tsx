"use client";

import Link from "next/link";
import MenuIcon from "@mui/icons-material/Menu";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { usePathname } from "next/navigation";
import { SidebarLinkProps } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import ComposeForm from "@/components/ComposeForm";

export default function Sidebar() {
  const [composeModalVisible, setComposeModalVisible] = useState(false);

  const pathname = usePathname();
  const compose = pathname.includes("compose");
  const inbox = pathname.includes("inbox");
  const starred = pathname.includes("starred");
  const sent = pathname.includes("sent");
  const modalRef = useRef<HTMLDivElement | null>(null);

  const sidebarArr = [
    { checkPath: compose, Icon: CreateOutlinedIcon, path: "compose" },
    { checkPath: inbox, Icon: InboxOutlinedIcon, path: "inbox" },
    { checkPath: starred, Icon: StarBorderOutlinedIcon, path: "starred" },
    { checkPath: sent, Icon: SendOutlinedIcon, path: "sent" },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;

      if (modalRef.current && !modalRef.current.contains(target)) {
        setComposeModalVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
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
              setModal={setComposeModalVisible}
            />
          ))}
        </nav>
      </aside>

      {composeModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div ref={modalRef} className="flex justify-center w-full max-w-225">
            <ComposeForm
              hideModal={() => setComposeModalVisible(false)}
              isModal={true}
              className="max-w-225"
              openForm={composeModalVisible}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const SidebarLink = ({ checkPath, Icon, path, setModal }: SidebarLinkProps) => {
  return (
    <Link
      href={path === "compose" ? "" : `/mail/${path}`}
      onClick={(e) => {
        if (checkPath) {
          e.preventDefault();
        } else {
          if (path === "compose") {
            setModal(true);
          }
        }
      }}
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
