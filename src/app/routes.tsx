import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { StudySpacePage } from "./pages/StudySpacePage";
import { AboutPage } from "./pages/AboutPage";
import { AdminPage } from "./pages/AdminPage";
import { PricingPage } from "./pages/PricingPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "login",   Component: LoginPage },
      { path: "signup",  Component: SignUpPage },
      { path: "about",           Component: AboutPage },
      { path: "pricing",         Component: PricingPage },
      { path: "payment/result",  Component: PaymentResultPage },
      {
        element: <ProtectedRoute forbiddenRole="Admin" forbiddenRedirect="/admin" allowGuest />,
        children: [
          { path: "space", Component: StudySpacePage },
        ],
      },
      {
        element: <ProtectedRoute requiredRole="Admin" />,
        children: [
          { path: "admin", Component: AdminPage },
        ],
      },
    ],
  },
]);