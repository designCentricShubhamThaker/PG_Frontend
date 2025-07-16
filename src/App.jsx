import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/useAuth.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoutes from './routes/ProtectedRoutes.jsx';
import DispatcherDashboard from './Dashboards/DispatcherDashboard.jsx';
import CapDashboard from './Dashboards/CapDashboard.jsx';
import GlassDashboard from './Dashboards/GlassDashboard.jsx';
import PumpDashboard from './Dashboards/PumpDashboard.jsx';
import BoxesDashboard from './Dashboards/BoxesDashboard.jsx';
import DecoPrintDashboard from './Dashboards/DecoPrintDashboard.jsx';
import DecoFrostDashboard from './Dashboards/DecoFrostDashboard.jsx';
import DecoCoatDashboard from './Dashboards/DecoCoatDashboard.jsx';
import DecoFoilDashbaord from './Dashboards/DecoFoilDashbaord.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import SuperAdminDashboard from './Dashboards/SuperAdminDashboard.jsx';
import TeamDashbaord from './Dashboards/TeamDashboard.jsx';
import AccessoriesDashboard from './Dashboards/AccessoriesDashboard.jsx';

// import LinerDashboard from './Dashboards/LinerDashboard';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          {/* <GlobalTeamSocketListener /> */}
          <Routes>

            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={<ProtectedRoutes element={<Navigate to="/admin" />} allowedRoles={['admin']} />}
            />

            <Route
              path="/superadmin"
              element={<ProtectedRoutes element={<SuperAdminDashboard />} allowedRoles={['superadmin']} />}
            />

            <Route
              path="/admin"
              element={<ProtectedRoutes element={<DispatcherDashboard />} allowedRoles={['admin']} />}
            />
            <Route
              path="/team"
              element={<ProtectedRoutes element={<TeamDashbaord />} allowedRoles={['team']} />}
            />

            <Route
              path="/dashboard/glass"
              element={<ProtectedRoutes element={<GlassDashboard />} allowedRoles={['user']} allowedTeams={['glass']} />}
            />
            <Route
              path="/dashboard/caps"
              element={<ProtectedRoutes element={<CapDashboard />} allowedRoles={['user']} allowedTeams={['caps']} />}
            />
            <Route
              path="/dashboard/pumps"
              element={<ProtectedRoutes element={<PumpDashboard />} allowedRoles={['user']} allowedTeams={['pumps']} />}
            />
            <Route
              path="/dashboard/boxes"
              element={<ProtectedRoutes element={<BoxesDashboard />} allowedRoles={['user']} allowedTeams={['boxes']} />}
            />
            <Route
              path="/dashboard/accessories"
              element={<ProtectedRoutes element={<AccessoriesDashboard />} allowedRoles={['user']} allowedTeams={['accessories']} />}
            />

            <Route
              path="/dashboard/printing"
              element={
                <ProtectedRoutes
                  element={<DecoPrintDashboard />}
                  allowedRoles={['user']}
                  allowedTeams={['printing']}
                />
              }
            />
            <Route
              path="/dashboard/frosting"
              element={
                <ProtectedRoutes
                  element={<DecoFrostDashboard />}
                  allowedRoles={['user']}
                  allowedTeams={['frosting']}

                />
              }
            />
            <Route
              path="/dashboard/coating"
              element={
                <ProtectedRoutes
                  element={<DecoCoatDashboard />}
                  allowedRoles={['user']}
                  allowedTeams={['coating']}

                />
              }
            />
            <Route
              path="/dashboard/foiling"
              element={
                <ProtectedRoutes
                  element={<DecoFoilDashbaord />}
                  allowedRoles={['user']}
                  allowedTeams={['foiling']}

                />
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>

      </AuthProvider>
    </BrowserRouter>
  );
};

export default App