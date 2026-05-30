import "../i18n";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { RouterProvider } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
      <ChakraProvider value={system}>
        <RouterProvider router={router} />
      </ChakraProvider>
    </GoogleOAuthProvider>
  );
}
