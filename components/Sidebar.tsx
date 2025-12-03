"use client";

import Link from "next/link";
import MenuIcon from "@mui/icons-material/Menu";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { usePathname } from "next/navigation";
import {useState} from "react";
import ComposeForm from "@/components/ComposeForm";

export default function Sidebar() {
  const pathname = usePathname();
  const inbox = pathname.includes("inbox");
  const compose = pathname.includes("compose");
  const sent = pathname.includes("sent");
    const [composeModalVisible, setComposeModalVisible] = useState(false);
    const showComposeModal = () => {
        setComposeModalVisible(true);
    };
    const hideComposeModal = () => {
        setComposeModalVisible(false);
    };

    const [isOpen, setIsOpen] = useState(false)

  return (
      <div>
          {composeModalVisible &&
              <ComposeForm hideModal={hideComposeModal} />}
          {/* <aside className="p-8 flex flex-col items-center gap-10"> */}
          <aside className={`fixed p-6 flex flex-col gap-8 h-full bg-[#F7FDFE] shadow-md transition-all duration-300
          ${isOpen ? "w-48" : "w-20"} z-50`}>
              {/* Burger */}
              <button onClick={() => setIsOpen(!isOpen)}
                className="flex justify-center"
              >
                <MenuIcon className="w-9! h-9!" />
                {/* <MenuIcon className="w-9! h-9! -ml-1" /> */}
              </button>
              {/* Content */}
              <nav className="flex flex-col gap-5 text-center">
                  <button
                      //href="/mail/compose"
                      className={`flex items-center gap-3 p-2 rounded-lg group hover:bg-[#03045E] cursor-pointer ${
                          composeModalVisible ? "bg-[#03045E] hover:bg-[#0077B6]!" : ""
                      }`}
                      onClick={showComposeModal}
                  >
                      <CreateOutlinedIcon
                          className={`w-7! h-7! text-[#03045E] group-hover:text-white ${
                              composeModalVisible ? "text-white" : ""
                          }`}
                      />
                      {isOpen && <span>Write</span>}
                  </button>

                  <Link
                      href="/mail/inbox"
                      className={`flex items-center gap-3 p-2 rounded-lg group hover:bg-[#03045E] ${
                          inbox ? "bg-[#03045E] hover:bg-[#0077B6]!" : ""
                      }`}
                  >
                      <InboxOutlinedIcon
                          className={`w-7! h-7! text-[#03045E] group-hover:text-white ${
                              inbox ? "text-white" : ""
                          }`}
                      />
                      {isOpen && <span>Inbox</span>}
                  </Link>
                  <Link
                      href="/mail/starred"
                      className="flex items-center gap-3 p-2 rounded-lg group hover:bg-[#03045E]"
                  >
                      <StarBorderOutlinedIcon className="w-7! h-7! text-[#03045E] group-hover:text-white" />
                      {isOpen && <span>Starred</span>}
                  </Link>
                  <Link
                      href="/mail/sent"
                      className={`flex items-center gap-3 p-2 rounded-lg group hover:bg-[#03045E] ${
                          sent ? "bg-[#03045E] hover:bg-[#0077B6]!" : ""
                      }`}
                  >
                      <SendOutlinedIcon
                          className={`w-7! h-7! text-[#03045E] group-hover:text-white ${
                              sent ? "text-white" : ""
                          }`}
                      />
                      {isOpen && <span>Sent</span>}
                  </Link>
              </nav>
          </aside>
      </div>
  );
}
