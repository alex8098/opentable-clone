import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Booking } from '../types';
import { bookingAPI } from '../services/api';

export default function MyBookings() {
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

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await bookingAPI.cancel(bookingId);
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg mb-4">You haven't made any bookings yet.</p>
          <Link
            to="/"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/restaurant/${booking.restaurantId}`}
                          className="text-xl font-semibold text-gray-900 hover:text-red-600 transition-colors"
                        >
                          {booking.restaurant?.name || 'Restaurant'}
                        </Link>
                        <p className="text-gray-600 mt-1">
                          {booking.restaurant?.cuisine} • {booking.restaurant?.city}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(booking.date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Time</p>
                        <p className="font-medium">{booking.time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Party Size</p>
                        <p className="font-medium">
                          {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Booking ID</p>
                        <p className="font-medium text-xs">#{booking.id.slice(-8)}</p>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-500">Special Requests:</p>
                        <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                      </div>
                    )}

                    {booking.status !== 'cancelled' && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Past</h2>
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg shadow-md p-6 opacity-75"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/restaurant/${booking.restaurantId}`}
                          className="text-lg font-semibold text-gray-700 hover:text-red-600 transition-colors"
                        >
                          {booking.restaurant?.name || 'Restaurant'}
                        </Link>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {formatDate(booking.date)} • {booking.time} • {booking.partySize}{' '}
                      {booking.partySize === 1 ? 'person' : 'people'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
