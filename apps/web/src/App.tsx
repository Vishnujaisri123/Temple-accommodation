import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import Booking from './pages/Booking';
import BookingStatus from './pages/BookingStatus';
import PaymentStatus from './pages/PaymentStatus';
import Contact from './pages/Contact';
import OwnerDashboard from './components/dashboard/OwnerDashboard';

const AppContent = () => {
  const { isAuthenticated, isDashboardActive, setIsDashboardActive } = useAuth();

  // Integrated Application State:
  // If authenticated owner has dashboard view active, render the Owner Dashboard within the same app
  if (isAuthenticated && isDashboardActive) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <OwnerDashboard />
        </main>
      </div>
    );
  }

  // State 1: Public Customer-Facing Application
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AudioPlayer />
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/book/:id?" element={<Booking />} />
          <Route path="/payment/status" element={<PaymentStatus />} />
          <Route path="/status" element={<BookingStatus />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Quick route to toggle owner dashboard if logged in */}
          <Route 
            path="/admin" 
            element={
              isAuthenticated ? (
                (() => {
                  setIsDashboardActive(true);
                  return <Navigate to="/" replace />;
                })()
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
