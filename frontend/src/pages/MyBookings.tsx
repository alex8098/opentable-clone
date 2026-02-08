import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Booking } from '../types';
import { bookingAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function MyBookings() {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingId(id);
    try {
      await bookingAPI.cancel(id);
      setBookings(bookings.map(b => 
        b.id === id ? { ...b, status: 'cancelled' } : b
      ));
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to view your bookings.</p>
        <Link
          to="/login"
          className="bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg mb-4">You don't have any bookings yet.</p>
          <Link
            to="/"
            className="bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{booking.restaurant?.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mb-1">
                  📅 {new Date(booking.date).toLocaleDateString()} at {booking.time}
                </p>
                <p className="text-gray-600 mb-1">
                  👥 {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                </p>
                {booking.specialRequests && (
                  <p className="text-gray-500 text-sm mt-2">
                    Note: {booking.specialRequests}
                  </p>
                )}
              </div>

              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                  className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                >
                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
