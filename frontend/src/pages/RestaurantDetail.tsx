import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Restaurant, Review } from '../types';
import { restaurantAPI, bookingAPI, reviewAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchReviews();
    }
  }, [id]);

  useEffect(() => {
    if (restaurant && bookingDate && partySize) {
      fetchAvailableSlots();
    }
  }, [restaurant, bookingDate, partySize]);

  const fetchRestaurant = async () => {
    try {
      const response = await restaurantAPI.getById(id!);
      setRestaurant(response.data);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getByRestaurant(id!);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await restaurantAPI.getAvailableSlots(id!, bookingDate, partySize);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/restaurant/${id}` } });
      return;
    }

    setBookingLoading(true);
    try {
      await bookingAPI.create({
        restaurantId: id!,
        date: bookingDate,
        time: bookingTime,
        partySize,
        specialRequests: specialRequests || undefined,
      });
      setBookingSuccess(true);
      setBookingDate('');
      setBookingTime('');
      setSpecialRequests('');
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderPriceRange = (range: number) => '$'.repeat(range);
  
  const renderStars = (rating: number) => 
    '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 text-lg">Restaurant not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="h-64 bg-gray-200 relative">
          {restaurant.images && restaurant.images.length > 0 ? (
            <img
              src={restaurant.images[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-r from-gray-100 to-gray-200">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-lg text-gray-600">{restaurant.cuisine}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {renderPriceRange(restaurant.priceRange)}
              </div>
              <div className="flex items-center mt-2">
                <span className="text-yellow-500 text-xl mr-2">
                  {renderStars(restaurant.rating)}
                </span>
                <span className="text-gray-600">({restaurant.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          <p className="text-gray-700 mb-4">{restaurant.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>📍 {restaurant.address}, {restaurant.city}</span>
            <span>📞 {restaurant.phone}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Make a Reservation</h2>
            
            {bookingSuccess ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p className="font-medium">Booking confirmed!</p>
                <p className="text-sm">Check your email for details.</p>
                <button
                  onClick={() => setBookingSuccess(false)}
                  className="mt-3 text-sm text-green-700 underline"
                >
                  Make another booking
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    min={getTomorrow()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Party Size
                  </label>
                  <select
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                      <option key={size} value={size}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <select
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select time</option>
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {bookingDate ? 'No slots available' : 'Select a date first'}
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests (optional)
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Any dietary requirements or special occasions?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading || !bookingTime}
                  className="w-full bg-red-600 text-white py-3 rounded-md font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {bookingLoading ? 'Booking...' : 'Book Now'}
                </button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-500 text-center">
                    You'll be asked to login to complete your booking
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Reviews</h2>
            
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-red-600 font-medium">
                            {review.user?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {review.user?.name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-yellow-500">
                        {renderStars(review.rating)}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
