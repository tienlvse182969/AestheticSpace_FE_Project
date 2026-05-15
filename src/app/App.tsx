import "../i18n";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        body: { value: "'HarmonyOS Sans', sans-serif" },
        heading: { value: "'HarmonyOS Sans', sans-serif" },
      },
    },
  },
});

export default function App() {
  return (
    <ChakraProvider value={system}>
      <RouterProvider router={router} />
    </ChakraProvider>
  );
}
