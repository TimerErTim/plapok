import { HeroUIProvider } from "@heroui/react";
import { useHref, useNavigate } from "react-router";

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  console.log("Mounted provider");

  return (
    <HeroUIProvider navigate={(...args) => {
      console.log("NextUIProvider.navigate", ...args);
      new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
        console.log("NextUIProvider.navigate resolved");``
        navigate(...args);
      });
    }} useHref={(...args) => {
      console.log("NextUIProvider.useHref", ...args);
      return useHref(...args);
    }}>
      {children}
    </HeroUIProvider>
  );
}
