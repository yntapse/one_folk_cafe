import { invoke } from '@tauri-apps/api/core';
import type {
  ProductWithCategory,
  Category,
  Customer,
  CafeTable,
  OrderWithDetails,
  OrderRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
  Settings,
  Notification,
  DashboardMetrics,
  TopProduct,
  TopCategory,
  SalesReport,
  PaginatedResponse,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  Claims,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateProductRequest,
  UpdateProductRequest,
  CreateTableRequest,
  UpdateTableRequest,
  CreateCustomerRequest,
  UpdateSettingsRequest,
} from '@/types';

// Auth
export const login = (request: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
  invoke('login', { request });

export const verifyToken = (token: string): Promise<ApiResponse<Claims>> =>
  invoke('verify_token', { token });

export const changePassword = (currentPassword: string, newPassword: string, token: string): Promise<ApiResponse<null>> =>
  invoke('change_password', { currentPassword, newPassword, token });

// Categories
export const getCategories = (): Promise<ApiResponse<Category[]>> =>
  invoke('get_categories');

export const createCategory = (request: CreateCategoryRequest): Promise<ApiResponse<Category>> =>
  invoke('create_category', { request });

export const updateCategory = (id: number, request: UpdateCategoryRequest): Promise<ApiResponse<Category>> =>
  invoke('update_category', { id, request });

export const deleteCategory = (id: number): Promise<ApiResponse<null>> =>
  invoke('delete_category', { id });

// Products
export const getProducts = (): Promise<ApiResponse<ProductWithCategory[]>> =>
  invoke('get_products');

export const getProduct = (id: number): Promise<ApiResponse<ProductWithCategory>> =>
  invoke('get_product', { id });

export const createProduct = (request: CreateProductRequest): Promise<ApiResponse<ProductWithCategory>> =>
  invoke('create_product', { request });

export const updateProduct = (id: number, request: UpdateProductRequest): Promise<ApiResponse<ProductWithCategory>> =>
  invoke('update_product', { id, request });

export const deleteProduct = (id: number): Promise<ApiResponse<null>> =>
  invoke('delete_product', { id });

export const toggleProductAvailability = (id: number): Promise<ApiResponse<ProductWithCategory>> =>
  invoke('toggle_product_availability', { id });

// Orders
export const getOrders = (params?: {
  page?: number;
  size?: number;
  status?: string;
  paymentStatus?: string;
  tableNumber?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<PaginatedResponse<OrderWithDetails>>> =>
  invoke('get_orders', params);

export const getOrder = (id: number): Promise<ApiResponse<OrderWithDetails>> =>
  invoke('get_order', { id });

export const createOrder = (request: OrderRequest): Promise<ApiResponse<OrderWithDetails>> =>
  invoke('create_order', { request });

export const updateOrder = (id: number, request: UpdateOrderRequest): Promise<ApiResponse<OrderWithDetails>> =>
  invoke('update_order', { id, request });

export const updateOrderStatus = (id: number, request: UpdateOrderStatusRequest): Promise<ApiResponse<OrderWithDetails>> =>
  invoke('update_order_status', { id, request });

export const updatePaymentStatus = (id: number, request: UpdatePaymentStatusRequest): Promise<ApiResponse<OrderWithDetails>> =>
  invoke('update_payment_status', { id, request });

export const deleteOrder = (id: number): Promise<ApiResponse<null>> =>
  invoke('delete_order', { id });

export const getOrderCounts = (params?: {
  tableNumber?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<Record<string, number>>> =>
  invoke('get_order_counts', params);

// Tables
export const getTables = (): Promise<ApiResponse<CafeTable[]>> =>
  invoke('get_tables');

export const createTable = (request: CreateTableRequest): Promise<ApiResponse<CafeTable>> =>
  invoke('create_table', { request });

export const updateTable = (id: number, request: UpdateTableRequest): Promise<ApiResponse<CafeTable>> =>
  invoke('update_table', { id, request });

export const deleteTable = (id: number): Promise<ApiResponse<null>> =>
  invoke('delete_table', { id });

export const updateTableStatus = (id: number, status: string): Promise<ApiResponse<CafeTable>> =>
  invoke('update_table_status', { id, status });

// Customers
export const getCustomers = (): Promise<ApiResponse<Customer[]>> =>
  invoke('get_customers');

export const createCustomer = (request: CreateCustomerRequest): Promise<ApiResponse<Customer>> =>
  invoke('create_customer', { request });

export const getOrCreateCustomer = (name: string, mobile: string): Promise<ApiResponse<Customer>> =>
  invoke('get_or_create_customer', { name, mobile });

// Analytics
export const getDashboardMetrics = (filter?: string): Promise<ApiResponse<DashboardMetrics>> =>
  invoke('get_dashboard_metrics', { filter });

export const getTopProducts = (filter?: string, limit?: number): Promise<ApiResponse<TopProduct[]>> =>
  invoke('get_top_products', { filter, limit });

export const getTopCategories = (filter?: string, limit?: number): Promise<ApiResponse<TopCategory[]>> =>
  invoke('get_top_categories', { filter, limit });

export const getSalesReport = (filter?: string): Promise<ApiResponse<SalesReport[]>> =>
  invoke('get_sales_report', { filter });

// Settings
export const getSettings = (): Promise<ApiResponse<Settings>> =>
  invoke('get_settings');

export const updateSettings = (request: UpdateSettingsRequest): Promise<ApiResponse<Settings>> =>
  invoke('update_settings', { request });

export const uploadImage = (fileName: string, base64Data: string): Promise<ApiResponse<string>> =>
  invoke('upload_image', { fileName, base64Data });

// Notifications
export const getNotifications = (): Promise<ApiResponse<Notification[]>> =>
  invoke('get_notifications');

export const markNotificationAsRead = (id: number): Promise<ApiResponse<null>> =>
  invoke('mark_as_read', { id });

export const markAllNotificationsAsRead = (): Promise<ApiResponse<null>> =>
  invoke('mark_all_as_read');

// Files
export const saveImage = (fileName: string, base64Data: string): Promise<ApiResponse<string>> =>
  invoke('save_image', { fileName, base64Data });

export const deleteImage = (fileUrl: string): Promise<ApiResponse<null>> =>
  invoke('delete_image', { fileUrl });