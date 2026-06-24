import { Outlet, useLocation } from "react-router";
import { Navbar } from "./components/homepage/Navbar";
import { Footer } from "./components/homepage/Footer";
import { AuthProvider } from "../context/AuthContext";

export function Root() {
  const location = useLocation();
  const isFullscreen = ["/login", "/signup", "/forgot-password", "/reset-password", "/space", "/admin"].includes(location.pathname);
  const noFooter = isFullscreen || location.pathname === "/about";

  return (
    <AuthProvider>
      {!isFullscreen && <Navbar />}
      <Outlet />
      {!noFooter && <Footer />}
    </AuthProvider>
  );
}
