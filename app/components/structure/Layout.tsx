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
        navigate("/dashboard", { viewTransition: true });
      }
    };

    document.addEventListener("keydown", keyDown);

    return () => document.removeEventListener("keydown", keyDown);
  }, []);

  return (
    <div
      className={`bg-background relative mx-auto flex h-[100dvh] flex-col lg:overflow-hidden`}
    >
      <Header setOpen={setOpen} />
      <div className="flex h-full flex-col overflow-hidden">{children}</div>
      <div
        className={`${isTransitioning ? "opacity-100" : "pointer-events-none opacity-0"} bg-background/25 absolute inset-0 z-9999 grid place-content-center backdrop-blur-lg transition`}
      >
        <Loader />
      </div>

      <Search search={{ open, setOpen }} />
      <Toaster />
    </div>
  );
}
