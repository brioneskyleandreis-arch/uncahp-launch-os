import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import NewLaunch from './pages/NewLaunch';
import LaunchDetails from './pages/LaunchDetails';
import LaunchSuccess from './pages/LaunchSuccess';
import Profile from './pages/Profile';
import Members from './pages/Members';
import AdsPerformance from './pages/AdsPerformance';
import PendingAccess from './pages/PendingAccess';
import ClientList from './pages/ClientList'; // Added
import ProfitTracker from './pages/ProfitTracker'; // Added
import ActiveCampaigns from './pages/ActiveCampaigns'; // Added
import FunnelsDashboard from './pages/FunnelsDashboard'; // Added
import Settings from './pages/Settings'; // Added
import { LaunchProvider } from './context/LaunchContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ClientProvider } from './context/ClientContext'; // Added
import { ProfitProvider } from './context/ProfitContext'; // Added
import ErrorBoundary from './components/ErrorBoundary';

import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // Added

function App() {
    console.log("[App.jsx] Rendering App tree");
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AuthProvider>
                    <ToastProvider>
                        <NotificationProvider>
                            <Router>
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<Auth />} />
                                    <Route path="/signup" element={<Auth />} />
                                    {/* Preview Route - Remove later */}
                                    <Route path="/pending-preview" element={<PendingAccess />} />

                                    {/* Protected Routes */}
                                    <Route path="/pending-access" element={
                                        <ProtectedRoute>
                                            <PendingAccess />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/" element={
                                        <ProtectedRoute>
                                            <ClientProvider> {/* Added */}
                                                <ProfitProvider> {/* Added */}
                                                    <LaunchProvider>
                                                        <AppLayout />
                                                    </LaunchProvider>
                                                </ProfitProvider> {/* Added */}
                                            </ClientProvider> {/* Added */}
                                        </ProtectedRoute>
                                    }>
                                        <Route index element={<Dashboard />} />
                                        <Route path="new-launch" element={<NewLaunch />} />
                                        <Route path="launch/:id" element={<LaunchDetails />} />
                                        <Route path="launch-success/:id" element={<LaunchSuccess />} />
                                        <Route path="profile" element={<Profile />} />
                                        <Route path="settings" element={<Settings />} />
                                        <Route path="members" element={<Members />} />
                                        <Route path="clients" element={<ClientList />} /> {/* Added */}
                                        <Route path="profit-tracker" element={<ProfitTracker />} /> {/* Added */}
                                        <Route path="active-campaigns" element={<ActiveCampaigns />} /> {/* Added */}
                                        <Route path="funnels" element={<FunnelsDashboard />} /> {/* Added */}
                                        <Route path="ads" element={<AdsPerformance />} />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Route>
                                </Routes>
                            </Router>
                        </NotificationProvider>
                    </ToastProvider>
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
