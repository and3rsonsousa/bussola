import { type ReactNode } from "react";
// import CreateAction from "./CreateAction";
import Header from "./Header";

// import Search from "./Search";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div
			className="relative
		 flex h-[100dvh] flex-col font-light text-gray-300 antialiased md:overflow-hidden"
		>
			<Header />
			<div className="flex h-full flex-col overflow-hidden">
				{children}
			</div>
			{/* <CreateAction /> */}
			{/* <Search /> */}
		</div>
	);
}
