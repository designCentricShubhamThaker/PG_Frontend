import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/useAuth';
import Login from './pages/Login';
import ProtectedRoutes from './routes/ProtectedRoutes';
import DispatcherDashboard from './Dashboards/DispatcherDashboard';
import CapDashboard from './Dashboards/CapDashboard';
import GlassDashboard from './Dashboards/GlassDashboard';
import PumpDashboard from './Dashboards/PumpDashboard';
import BoxDashboard from './Dashboards/BoxDashboard';
import StickerDashboard from './Dashboards/StickerDashboard';
import DecoPrintDashboard from './Dashboards/DecoPrintDashboard ';
import DecoFrostDashboard from './Dashboards/DecoFrostDashboard';
import DecoCoatDashboard from './Dashboards/DecoCoatDashboard';
import DecoFoilDashbaord from './Dashboards/DecoFoilDashbaord';
// import LinerDashboard from './Dashboards/LinerDashboard';


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />
          
          {/* Redirect root to login or dashboard based on auth status */}
          <Route 
            path="/" 
            element={<ProtectedRoutes element={<Navigate to="/admin" />} allowedRoles={['admin']} />} 
          />
          
          {/* Admin routes */}
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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App