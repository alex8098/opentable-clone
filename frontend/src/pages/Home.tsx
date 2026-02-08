import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Restaurant } from '../types';
import { restaurantAPI } from '../services/api';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [searchTerm, selectedCuisine, selectedCity, restaurants]);

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantAPI.getAll();
      setRestaurants(response.data);
      setFilteredRestaurants(response.data);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    let filtered = restaurants;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCuisine) {
      filtered = filtered.filter((r) => r.cuisine === selectedCuisine);
    }

    if (selectedCity) {
      filtered = filtered.filter((r) => r.city === selectedCity);
    }

    setFilteredRestaurants(filtered);
  };

  const cuisines = [...new Set(restaurants.map((r) => r.cuisine))];
  const cities = [...new Set(restaurants.map((r) => r.city))];

  const renderPriceRange = (range: number) => {
    return '$'.repeat(range);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-8 mb-8 text-white">
        <h1 className="text-4xl font-bold mb-4">Find your table for any occasion</h1>
        <p className="text-lg opacity-90">Book the best restaurants in your city</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuisine
            </label>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All Cuisines</option>
              {cuisines.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            to={`/restaurant/${restaurant.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="h-48 bg-gray-200 relative">
              {restaurant.images && restaurant.images.length > 0 ? (
                <img
                  src={restaurant.images[0]}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {restaurant.name}
                </h3>
                <span className="text-green-600 font-medium">
                  {renderPriceRange(restaurant.priceRange)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {restaurant.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">
                    {renderStars(restaurant.rating)}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({restaurant.reviewCount} reviews)
                  </span>
                </div>
                <span className="text-sm text-gray-500">{restaurant.city}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No restaurants found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
