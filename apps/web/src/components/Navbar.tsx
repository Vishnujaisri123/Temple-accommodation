import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem', margin: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          Vadapalli Accommodation
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/rooms">Rooms</Link>
          <Link to="/status">Booking Status</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
