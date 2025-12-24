
export enum UserType {
  ADVERTISER = 'ADVERTISER',
  REGULAR = 'REGULAR',
  ZONE_OWNER = 'ZONE_OWNER',
}

export type PrivacyLevel = 'Everyone' | 'My Contacts' | 'Nobody';

export interface UserSettings {
  isVisuallyImpaired: boolean;
  lastSeen?: PrivacyLevel;
  profilePhoto?: PrivacyLevel;
  readReceipts?: boolean;
}

export interface CollectedAd {
  id: string;
  campaignId: string; // ID of the AdRentalRequest or AdZone
  adContent: AdContent;
  collectedAt: number;
  redeemed: boolean;
}

export interface User {
  id: string;
  name: string;
  type: UserType;
  settings: UserSettings;
  points: number;
  inventory: CollectedAd[];
  email?: string;
  phoneNumber?: string;
  bio?: string;
  avatar?: string;
  balance: number; // For Advertiser to spend, Owner to withdraw
  totalEarnings?: number; // For Zone Owners
  escrowBalance?: number; // Funds held from active ads
  age?: number;
  gender?: string;
  location?: {
    country: string;
    city: string;
    zipCode: string;
  };
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type ZoneShape = 'CIRCLE' | 'RECTANGLE';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: number;
  duration: number;
}

export interface AdZone {
  id: string;
  ownerId: string; // ID of the Zone Owner
  name: string;
  shape: ZoneShape;
  center: GeoPoint;
  radius: number;
  width: number;
  height: number;
  adContent?: AdContent; // Native ad content if any
  isActive: boolean;
  expiryDate?: number;
  pricePer1k: number; // CPM Price set by owner
  totalCostPaid?: number; // Total spent by owner to keep zone active
  paymentHistory?: PaymentRecord[];
}

export interface AdContent {
  title: string;
  description: string;
  rewardPoints: number;
  companyName: string;
  videoUrl?: string;
}

export type RentalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';

export interface AdRentalRequest {
  id: string;
  zoneId: string;
  advertiserId: string;
  advertiserName: string;
  adContent: AdContent;
  targetViews: number;
  currentViews: number;
  pricePer1k: number;
  totalPrice: number;
  status: RentalStatus;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  participants: string[];
  messages: ChatMessage[];
  lastMessageTime: number;
}
