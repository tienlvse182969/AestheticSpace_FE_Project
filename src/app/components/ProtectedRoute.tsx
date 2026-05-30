import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Flex, Spinner } from "@chakra-ui/react";

interface Props {
  requiredRole?: string;
  forbiddenRole?: string;
  forbiddenRedirect?: string;
}

export function ProtectedRoute({ requiredRole, forbiddenRole, forbiddenRedirect = "/" }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Flex height="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (forbiddenRole && user.role === forbiddenRole) {
    return <Navigate to={forbiddenRedirect} replace />;
  }

  return <Outlet />;
}
