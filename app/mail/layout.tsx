import Sidebar from "@/components/Sidebar";
import UserHeader from "@/components/UserHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="w-full">
        <UserHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
