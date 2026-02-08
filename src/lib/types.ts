export type Role = "buyer" | "seller" | "pro" | "admin";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  bio: string | null;
  service_area: string | null;
  created_at: string;
};

export type Listing = {
  id: string;
  owner_id: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string | null;
  status: "active" | "pending" | "sold" | "draft";
  created_at: string;
  updated_at: string;
};

export type Media = {
  id: string;
  listing_id: string;
  type: "photo" | "video";
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string | null;
  sort_order: number;
  created_at: string;
};
