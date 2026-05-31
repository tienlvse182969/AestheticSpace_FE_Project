import { Outlet, useLocation } from "react-router";
import { Navbar } from "./components/homepage/Navbar";
import { Footer } from "./components/homepage/Footer";
import { AuthProvider } from "../context/AuthContext";

export function Root() {
  const location = useLocation();
  const isFullscreen = ["/login", "/signup", "/forgot-password", "/reset-password", "/space", "/admin"].includes(location.pathname);

  return (
    <AuthProvider>
      {!isFullscreen && <Navbar />}
      <Outlet />
      {!isFullscreen && <Footer />}
    </AuthProvider>
  );
}
