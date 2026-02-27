import Link from "next/link";
import AuthHeader from "@/components/AuthHeader";
import MiniCart from "@/components/MiniCart";
import SearchBox from "@/components/search/SearchBox";
import BottomNav from "@/components/layout/BottomNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import HeaderPro from "../Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderPro />


      <main >
        <div>{children}</div>
      </main>

      <PwaInstallPrompt />
      <BottomNav />
    </>
  );
}
