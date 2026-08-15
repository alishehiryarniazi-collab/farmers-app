export type Role = "FARMER" | "BUYER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  bio?: string | null;
}

export interface FarmerProfile {
  id: string;
  name: string;
  bio: string | null;
  createdAt: string;
  listings: Listing[];
  avgRating: number | null;
  reviewCount: number;
}

export interface Review {
  id: string;
  orderId: string;
  buyerId: string;
  farmerId: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string;
  buyer?: { id: string; name: string };
  farmer?: { id: string; name: string };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type ListingStatus = "ACTIVE" | "SOLD_OUT";

export interface Listing {
  id: string;
  farmerId: string;
  title: string;
  description: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  quantityAvailable: number;
  imageUrl: string | null;
  status: ListingStatus;
  isHidden: boolean;
  createdAt: string;
  farmer?: { id: string; name: string; phone: string | null; email: string | null };
}

export interface ListingsPage {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID";
export type DeliveryStatus = "NOT_PACKED" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED";

export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_STATUS_CHANGED"
  | "NEW_MESSAGE"
  | "SCAN_COMPLETE"
  | "NEW_REVIEW";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Guideline {
  id: string;
  title: string;
  category: string;
  body: string;
  createdAt: string;
}

export type Severity = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export interface ScanResult {
  id: string;
  userId: string;
  imageUrl: string;
  cropType: string | null;
  isHealthy: boolean;
  diagnosis: string;
  confidence: number;
  severity: Severity;
  symptoms: string;
  treatment: string;
  notes: string;
  createdAt: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: Role;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: ChatParticipant;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  farmerId: string;
  buyerId: string;
  listingId: string | null;
  farmer: ChatParticipant;
  buyer: ChatParticipant;
  messages?: Message[];
}

export type RecurringFrequency = "WEEKLY" | "MONTHLY";

export interface RecurringOrder {
  id: string;
  buyerId: string;
  listingId: string;
  listing: Listing;
  quantity: number;
  frequency: RecurringFrequency;
  active: boolean;
  nextOrderDate: string;
  lastOrderId: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  listing: Listing;
  buyer?: { id: string; name: string; phone: string | null; email: string | null };
  review?: Review | null;
}

export interface AdminStats {
  totalUsers: number;
  totalFarmers: number;
  totalBuyers: number;
  suspendedUsers: number;
  totalListings: number;
  activeListings: number;
  hiddenListings: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalReviews: number;
  hiddenReviews: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isSuspended: boolean;
  createdAt: string;
  _count: { listings: number; orders: number };
}

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminListingsPage {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminReviewsPage {
  reviews: Review[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
