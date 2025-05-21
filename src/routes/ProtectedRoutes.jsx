import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';


const ProtectedRoutes = ({ element, allowedRoles = [], allowedTeams = [], allowedSubteams = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role access
  const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(user.role);

  // Check team access
  const hasTeamAccess = allowedTeams.length === 0 || 
    (user.team && allowedTeams.includes(user.team));

  // Check subteam access
  const hasSubteamAccess = allowedSubteams.length === 0 || 
    (user.subteam && allowedSubteams.includes(user.subteam));

  // Admin can access all routes
  if (user.role === 'admin') {
    return element;
  }

  // Regular user needs both role and team/subteam access
  if (hasRoleAccess && hasTeamAccess && hasSubteamAccess) {
    return element;
  }

  // If unauthorized, redirect to appropriate dashboard
  if (user.role === 'user') {
    if (user.subteam) {
      return <Navigate to={`/dashboard/${user.team}/${user.subteam}`} replace />;
    } else {
      return <Navigate to={`/dashboard/${user.team}`} replace />;
    }
  }

  // Default redirect to login
  return <Navigate to="/login" replace />;
};

export default ProtectedRoutes;