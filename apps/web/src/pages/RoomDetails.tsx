import { useParams } from 'react-router-dom';

const RoomDetails = () => {
  const { id } = useParams();
  
  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <h1>Room Details {id}</h1>
    </div>
  );
};

export default RoomDetails;
