import { Outlet, useLocation } from "react-router";
import { Navbar } from "./components/homepage/Navbar";
import { Footer } from "./components/homepage/Footer";
import { AuthProvider } from "../context/AuthContext";

export function Root() {
  const location = useLocation();
  const isFullscreen = location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/space" || location.pathname === "/admin";

  return (
    <AuthProvider>
      {!isFullscreen && <Navbar />}
      <Outlet />
      {!isFullscreen && <Footer />}
    </AuthProvider>
  );
}
