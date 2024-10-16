import { useNavigate, useOutletContext } from "@remix-run/react";
import { useEffect, useState, type ReactNode } from "react";
import Header from "./Header";
import Search from "./Search";
import Loader from "./Loader";
import { Toaster } from "../ui/toaster";

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { isTransitioning, setTransitioning } =
    useOutletContext() as ContextType;
  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.code === "KeyH" && event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        setTransitioning(true);
        navigate("/dashboard", { unstable_viewTransition: true });
      }
    };

    document.addEventListener("keydown", keyDown);

    return () => document.removeEventListener("keydown", keyDown);
  }, []);

  return (
    <div
      className={`relative flex h-[100dvh] flex-col bg-background lg:overflow-hidden`}
    >
      <div className="flex h-full flex-col overflow-hidden">{children}</div>
      <div
        className={`${isTransitioning ? "opacity-100" : "pointer-events-none opacity-0"} absolute inset-0 z-[9999] grid place-content-center bg-background/25 backdrop-blur-lg transition`}
      >
        <Loader />
      </div>
      <Header open={open} setOpen={setOpen} />
      <Search open={open} setOpen={setOpen} />
      <Toaster />
    </div>
  );
}
