export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  address: string;
  city: string;
  phone: string;
  priceRange: 1 | 2 | 3 | 4;
  rating: number;
  reviewCount: number;
  images: string[];
  openingHours: OpeningHours;
  capacity: number;
  tables: Table[];
}

export interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Table {
  id: string;
  size: number;
  quantity: number;
}

export interface Booking {
  id: string;
  userId: string;
  restaurantId: string;
  restaurant?: Restaurant;
  date: string;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  user?: User;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
