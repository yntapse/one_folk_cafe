export interface Product {
  id: number;
  name: string;
  description?: string;
  full_plate_price: number;
  half_plate_price?: number;
  half_plate_available: boolean;
  image_url?: string;
  category_id: number;
  available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category_name: string;
}

export interface Category {
  id: number;
  name: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  image_url?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category_id: number;
  full_plate_price: number;
  half_plate_price?: number;
  half_plate_available: boolean;
  image_url?: string;
  available?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category_id?: number;
  full_plate_price?: number;
  half_plate_price?: number;
  half_plate_available?: boolean;
  image_url?: string;
  available?: boolean;
}

export interface CreateTableRequest {
  table_number: string;
  capacity: number;
}

export interface UpdateTableRequest {
  table_number?: string;
  capacity?: number;
  status?: string;
}

export interface CreateCustomerRequest {
  name: string;
  mobile: string;
}

export interface GalleryItemRequest {
  src: string;
  title: string;
  category: string;
}

export interface UpdateSettingsRequest {
  cafe_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  open_time?: string;
  close_time?: string;
  instagram_link?: string;
  description?: string;
  our_story_image?: string;
  featured_product_ids?: number[];
  gallery_items?: GalleryItemRequest[];
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  created_at: string;
}

export interface CafeTable {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  serving_type: string;
  quantity: number;
  price: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product_name: string;
  product_image?: string;
}

export interface Order {
  id: number;
  customer_id?: number;
  table_number?: string;
  status: string;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  paid_at?: string;
  created_at: string;
}

export interface OrderWithDetails {
  order: Order;
  customer_name?: string;
  customer_mobile?: string;
  items: OrderItemWithProduct[];
}

export interface OrderRequest {
  customer_name?: string;
  customer_mobile?: string;
  table_number?: string;
  items: {
    product_id: number;
    serving_type?: 'FULL' | 'HALF';
    quantity: number;
  }[];
}

export interface UpdateOrderRequest {
  customer_name?: string;
  customer_mobile?: string;
  table_number?: string;
  items?: {
    product_id: number;
    serving_type?: 'FULL' | 'HALF';
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: string;
}

export interface UpdatePaymentStatusRequest {
  payment_status: string;
  payment_method?: string;
}

export interface Settings {
  id: number;
  cafe_name: string;
  address?: string;
  phone?: string;
  email?: string;
  open_time: string;
  close_time: string;
  instagram_link?: string;
  description?: string;
  our_story_image?: string;
  featured_product_ids?: string;
  gallery_items?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  message: string;
  order_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_customers: number;
  total_products: number;
  avg_order_value: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface TopCategory {
  category_id: number;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface SalesReport {
  date: string;
  total_orders: number;
  total_revenue: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  total_elements: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface Claims {
  sub: string;
  role: string;
  exp: number;
  iat: number;
}