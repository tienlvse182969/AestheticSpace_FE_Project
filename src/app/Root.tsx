import { Outlet, useLocation } from "react-router";
import { Navbar } from "./components/homepage/Navbar";
import { Footer } from "./components/homepage/Footer";

export function Root() {
  const location = useLocation();
  const isFullscreen = location.pathname === "/login" || location.pathname === "/space";

  return (
    <>
      {!isFullscreen && <Navbar />}
      <Outlet />
      {!isFullscreen && <Footer />}
    </>
  );
}