
import { AdZone, User, UserType, AdRentalRequest } from './types';

// Dubai Coordinates
export const DUBAI_CENTER = { lat: 25.1972, lng: 55.2744 };

// Platform Logic
export const PLATFORM_COMMISSION = 0.10; // 10%
export const DEFAULT_CPM = 15.00; // $15 per 1000 views

// Zone Owner Pricing Restore
// Base cost: 1 m² per month = 0.0025 USD
export const ZONE_PRICE_PER_SQM_MONTH = 0.0025;
export const MIN_ZONE_AREA = 50;

// Helper to set future date
const daysFromNow = (days: number) => Date.now() + days * 24 * 60 * 60 * 1000;

export const INITIAL_ZONES: AdZone[] = [
  {
    id: '1',
    ownerId: 'u-owner-1',
    name: 'Burj Khalifa Plaza',
    shape: 'CIRCLE',
    center: { lat: 25.1972, lng: 55.2744 },
    radius: 300,
    width: 0,
    height: 0,
    isActive: true,
    expiryDate: daysFromNow(30),
    pricePer1k: 25.00,
    adContent: {
      title: "Burj Luxury Dining",
      description: "Experience fine dining at the top. 20% off for Adinci users.",
      rewardPoints: 50,
      companyName: "Atmosphere",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    }
  },
  {
    id: '2',
    ownerId: 'u-owner-2',
    name: 'DIFC Gateway',
    shape: 'RECTANGLE',
    center: { lat: 25.2048, lng: 55.2708 },
    radius: 0,
    width: 500,
    height: 400,
    isActive: true,
    expiryDate: daysFromNow(15),
    pricePer1k: 18.50,
    adContent: {
      title: "Crypto Expo 2024",
      description: "Join the biggest blockchain event in DIFC. Free entry for the first 100 users.",
      rewardPoints: 100,
      companyName: "FutureTech"
    }
  }
];

export const MOCK_RENTAL_REQUESTS: AdRentalRequest[] = [
  {
    id: 'rent-mock-1',
    zoneId: '1',
    advertiserId: 'u-adv-1',
    advertiserName: 'Test Advertiser',
    adContent: {
      title: "New Year Bash 2025",
      description: "The biggest party in Dubai. Book tickets now!",
      rewardPoints: 75,
      companyName: "Events DXB",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    targetViews: 5000,
    currentViews: 0,
    pricePer1k: 25.00,
    totalPrice: 125.00,
    status: 'PENDING',
    createdAt: Date.now() - 3600000 // 1 hour ago
  }
];

export const MOCK_STATS = [
  { name: 'Mon', views: 40, clicks: 24, pointsRedeemed: 1200 },
  { name: 'Tue', views: 30, clicks: 13, pointsRedeemed: 650 },
  { name: 'Wed', views: 20, clicks: 9, pointsRedeemed: 450 },
  { name: 'Thu', views: 27, clicks: 19, pointsRedeemed: 950 },
  { name: 'Fri', views: 18, clicks: 8, pointsRedeemed: 400 },
  { name: 'Sat', views: 23, clicks: 15, pointsRedeemed: 750 },
  { name: 'Sun', views: 34, clicks: 20, pointsRedeemed: 1000 },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u-owner-1',
    name: 'Test Owner',
    email: 'zone@test.com',
    type: UserType.ZONE_OWNER,
    phoneNumber: '+971501112233',
    bio: 'Premium zone management.',
    avatar: '#1e293b',
    settings: { isVisuallyImpaired: false },
    points: 0,
    inventory: [],
    balance: 540.20,
    totalEarnings: 1250.00,
    escrowBalance: 0
  },
  {
    id: 'u-adv-1',
    name: 'Test Advertiser',
    email: 'ads@test.com',
    type: UserType.ADVERTISER,
    phoneNumber: '+971556677889',
    bio: 'Looking for local reach.',
    avatar: '#7c3aed',
    settings: { isVisuallyImpaired: false },
    points: 0,
    inventory: [],
    balance: 1000.00
  },
  {
    id: 'u-reg-1',
    name: 'Test User',
    email: 'usr@test.com',
    type: UserType.REGULAR,
    phoneNumber: '+971550001111',
    bio: 'Exploring and earning.',
    avatar: '#3b82f6',
    settings: { isVisuallyImpaired: false },
    points: 150,
    inventory: [],
    balance: 0
  }
];
