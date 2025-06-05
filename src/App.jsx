import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/useAuth.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoutes from './routes/ProtectedRoutes.jsx';
import DispatcherDashboard from './Dashboards/DispatcherDashboard.jsx';
import CapDashboard from './Dashboards/CapDashboard.jsx';
import GlassDashboard from './Dashboards/GlassDashboard.jsx';
import PumpDashboard from './Dashboards/PumpDashboard.jsx';
import BoxDashboard from './Dashboards/BoxDashboard.jsx';
import StickerDashboard from './Dashboards/StickerDashboard.jsx';
import DecoPrintDashboard from './Dashboards/DecoPrintDashboard.jsx';
import DecoFrostDashboard from './Dashboards/DecoFrostDashboard.jsx';
import DecoCoatDashboard from './Dashboards/DecoCoatDashboard.jsx';
import DecoFoilDashbaord from './Dashboards/DecoFoilDashbaord.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import SuperAdminDashboard from './Dashboards/SuperAdminDashboard.jsx';
// import LinerDashboard from './Dashboards/LinerDashboard';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
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
              path="/dashboard/glass"
              element={<ProtectedRoutes element={<GlassDashboard />} allowedRoles={['user']} allowedTeams={['glass']} />}
            />
            <Route
              path="/dashboard/cap"
              element={<ProtectedRoutes element={<CapDashboard />} allowedRoles={['user']} allowedTeams={['cap']} />}
            />
            <Route
              path="/dashboard/pump"
              element={<ProtectedRoutes element={<PumpDashboard />} allowedRoles={['user']} allowedTeams={['pump']} />}
            />
            <Route
              path="/dashboard/box"
              element={<ProtectedRoutes element={<BoxDashboard />} allowedRoles={['user']} allowedTeams={['box']} />}
            />
            <Route
              path="/dashboard/sticker"
              element={<ProtectedRoutes element={<StickerDashboard />} allowedRoles={['user']} allowedTeams={['sticker']} />}
            />
            {/* <Route 
            path="/dashboard/liner" 
            element={<ProtectedRoutes element={<LinerDashboard />} allowedRoles={['user']} allowedTeams={['liner']} />}
          /> */}

            <Route
              path="/dashboard/decoration/deco_print"
              element={
                <ProtectedRoutes
                  element={<DecoPrintDashboard />}
                  allowedRoles={['user']}
                  allowedTeams={['decoration']}
                  allowedSubteams={['deco_print']}
                />
              }
            />
            <Route
              path="/dashboard/decoration/frost"
              element={
                <ProtectedRoutes
                  element={<DecoFrostDashboard />}
                  allowedRoles={['user']}
                  allowedTeams={['decoration']}
                  allowedSubteams={['frost']}
                />
              }
            />
            <Route
              path="/dashboard/decoration/deco_coat"
              element={
                <ProtectedRoutes
                  element={<DecoCoatDashboard />}
                  allowedRoles={['user']}
                  allowedTeams={['decoration']}
                  allowedSubteams={['deco_coat']}
                />
              }
            />
            <Route
              path="/dashboard/decoration/foil"
              element={
                <ProtectedRoutes
                  element={<DecoFoilDashbaord />}
                  allowedRoles={['user']}
                  allowedTeams={['decoration']}
                  allowedSubteams={['foil']}
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