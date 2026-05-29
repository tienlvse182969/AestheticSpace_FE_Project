import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { StudySpacePage } from "./pages/StudySpacePage";
import { AboutPage } from "./pages/AboutPage";
import { AdminPage } from "./pages/AdminPage";
import { PricingPage } from "./pages/PricingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "login",  Component: LoginPage },
      { path: "signup", Component: SignUpPage },
      { path: "space",  Component: StudySpacePage },
      { path: "about",  Component: AboutPage },
      { path: "admin",  Component: AdminPage },
      { path: "pricing", Component: PricingPage },
    ],
  },
]);