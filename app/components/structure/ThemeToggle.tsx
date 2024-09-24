import clsx from "clsx";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "../ui/button";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Theme, useTheme } from "~/lib/theme-provider";

export const ThemeToggle = ({
  element = "button",
  className,
  iconClassName,
  hasText,
}: {
  element?: "button" | "dropdownmenuitem";
  className?: string;
  iconClassName?: string;
  hasText?: boolean;
}) => {
  // let Component = element === "button" ? Button : DropdownMenuItem;

  const [theme, setTheme] = useTheme();

  function resolveTheme() {
    setTheme((currentTheme) =>
      currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
    );
  }

  const Content =
    theme === "light" ? (
      <>
        <MoonIcon className={clsx("size-4 opacity-50", iconClassName)} />
        {hasText && <span>Modo escuro</span>}
      </>
    ) : (
      <>
        <SunIcon className={clsx("size-4 opacity-50", iconClassName)} />
        {hasText && <span>Modo claro</span>}
      </>
    );

  return element === "button" ? (
    <Button
      variant={"ghost"}
      className={clsx(className)}
      onClick={() => {
        resolveTheme();
      }}
    >
      {Content}
    </Button>
  ) : (
    <DropdownMenuItem
      className={clsx(className)}
      onSelect={() => {
        resolveTheme();
      }}
    >
      {Content}
    </DropdownMenuItem>
  );
};
