// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/useAuth.jsx';

// const ProtectedRoutes = ({ element, allowedRoles = [], allowedTeams = [], allowedSubteams = [] }) => {
//   const { user } = useAuth();
//   const location = useLocation();

//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(user.role);

//   const hasTeamAccess = allowedTeams.length === 0 ||
//     (user.team && allowedTeams.includes(user.team));

//   const hasSubteamAccess = allowedSubteams.length === 0 ||
//     (user.subteam && allowedSubteams.includes(user.subteam));

//   if (user.role === 'admin') {
//     return element;
//   }

//   if (user.role === 'superadmin') {
//     return element; 
//   }
//   if (user.role === 'team') {
//     return element; 
//   }

//   if (hasRoleAccess && hasTeamAccess && hasSubteamAccess) {
//     return element;
//   }

//   if (user.role === 'user') {
//     if (user.subteam) {
//       return <Navigate to={`/dashboard/${user.team}/${user.subteam}`} replace />;
//     } else {
//       return <Navigate to={`/dashboard/${user.team}`} replace />;
//     }
//   }

//   return <Navigate to="/login" replace />;
// };

// export default ProtectedRoutes;


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.jsx';

const ProtectedRoutes = ({ element, allowedRoles = [], allowedTeams = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRoleAccess =
    allowedRoles.length === 0 || allowedRoles.includes(user.role);

  const hasTeamAccess =
    allowedTeams.length === 0 || (user.team && allowedTeams.includes(user.team));


  if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'team') {
    return element;
  }

  if (hasRoleAccess && hasTeamAccess) {
    return element;
  }

  if (user.role === 'user' && user.team) {
    return <Navigate to={`/dashboard/${user.team}`} replace />;
  }
  return <Navigate to="/login" replace />;
};

export default ProtectedRoutes;
