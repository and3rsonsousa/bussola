import { useState, type ReactNode } from "react";
// import CreateAction from "./CreateAction";
import Header from "./Header";
import CreateAction from "./CreateAction";
import Search from "./Search";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`relative flex h-[100dvh] flex-col bg-background md:overflow-hidden`}
    >
      <Header />
      <div className="flex h-full flex-col lg:overflow-hidden">{children}</div>

      <CreateAction mode="fixed" />
      <Search />
    </div>
  );
}
