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

  return (
      <div>
          {composeModalVisible &&
              <ComposeForm hideModal={hideComposeModal} />}
          <aside className="p-8 flex flex-col items-center gap-10">
              {/* Burger */}
              <MenuIcon className="w-9! h-9! -ml-1" />
              {/* Content */}
              <nav className="flex flex-col gap-5 text-center">
                  <button
                      //href="/mail/compose"
                      className={`w-fit p-2 rounded-lg group hover:bg-[#03045E] cursor-pointer ${
                          composeModalVisible ? "bg-[#03045E] hover:bg-[#0077B6]!" : ""
                      }`}
                      onClick={showComposeModal}
                  >
                      <CreateOutlinedIcon
                          className={`w-7! h-7! text-[#03045E] group-hover:text-white ${
                              composeModalVisible ? "text-white" : ""
                          }`}
                      />
                  </button>

                  <Link
                      href="/mail/inbox"
                      className={`w-fit p-2 rounded-lg group hover:bg-[#03045E] ${
                          inbox ? "bg-[#03045E] hover:bg-[#0077B6]!" : ""
                      }`}
                  >
                      <InboxOutlinedIcon
                          className={`w-7! h-7! text-[#03045E] group-hover:text-white ${
                              inbox ? "text-white" : ""
                          }`}
                      />
                  </Link>
                  <Link
                      href="/mail/starred"
                      className="w-fit p-2 rounded-lg group hover:bg-[#03045E]"
                  >
                      <StarBorderOutlinedIcon className="w-7! h-7! text-[#03045E] group-hover:text-white" />
                  </Link>
                  <Link
                      href="/mail/sent"
                      className={`w-fit p-2 rounded-lg group hover:bg-[#03045E] ${
                          sent ? "bg-[#03045E] hover:bg-[#0077B6]!" : ""
                      }`}
                  >
                      <SendOutlinedIcon
                          className={`w-7! h-7! text-[#03045E] group-hover:text-white ${
                              sent ? "text-white" : ""
                          }`}
                      />
                  </Link>
              </nav>
          </aside>
      </div>
  );
}
