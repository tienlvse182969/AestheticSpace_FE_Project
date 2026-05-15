import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { StudySpacePage } from "./pages/StudySpacePage";
import { AboutPage } from "./pages/AboutPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: AuthPage },
      { path: "space", Component: StudySpacePage },
      { path: "about", Component: AboutPage },
    ],
  },
]);