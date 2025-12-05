import Sidebar from "@/components/Sidebar";
import UserHeader from "@/components/UserHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <UserHeader />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
