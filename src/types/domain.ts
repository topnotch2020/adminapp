export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  phone?: string;
  role?: string;
};

export type Broker = {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  phone?: string;
  createdAt?: string;
  role?: string;
  status?: "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED" | "BLOCKED";
};

export type Property = {
  id?: string;
  _id?: string;
  brokerId?:
    | string
    | {
        _id?: string;
        fname?: string;
        lname?: string;
        email?: string;
        phone?: string;
        role?: string;
        status?: string;
      };
  listingType?: string;
  status?: string;
  bhkType?: string;
  propertyType?: { value?: string; label?: string } | string;
  pricing?: { price?: number; formattedPrice?: string };
  address?: {
    projectName?: string;
    areaName?: string;
    subArea?: string;
    city?: string;
    pincode?: string;
  };
  broker?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  images?: { url?: string; type?: string; isPrimary?: boolean }[];
  amenities?: string[];
  availableFrom?: string;
  facing?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Notification = {
  _id: string;
  brokerId?:
    | string
    | {
        _id?: string;
        fname?: string;
        lname?: string;
        email?: string;
      };
  propertyId?: string;
  type: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  unread: boolean;
  createdAt: string;
};

export type DashboardMetrics = {
  brokersTotal?: number;
  adminsTotal?: number;
  propertiesTotal?: number;
  pendingProperties?: number;
  notificationsUnread?: number;
};

export type Pagination = {
  total: number;
  limit: number;
  skip: number;
  hasMore?: boolean;
};

export type AuditLog = {
  id: string;
  event: string;
  message: string;
  actor?: string;
  target?: string;
  createdAt: string;
};
