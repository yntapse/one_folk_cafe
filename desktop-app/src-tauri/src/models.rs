use serde::{Deserialize, Serialize};
use chrono::{DateTime, Local};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Admin {
    pub id: i64,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub image_url: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub full_plate_price: f64,
    pub half_plate_price: Option<f64>,
    pub half_plate_available: bool,
    pub image_url: Option<String>,
    pub category_id: i64,
    pub available: bool,
    pub is_active: bool,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProductWithCategory {
    #[serde(flatten)]
    #[sqlx(flatten)]
    pub product: Product,
    pub category_name: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub mobile: String,
    pub created_at: DateTime<Local>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct CafeTable {
    pub id: i64,
    pub table_number: String,
    pub capacity: i64,
    pub status: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Order {
    pub id: i64,
    pub customer_id: Option<i64>,
    pub table_number: Option<String>,
    pub status: String,
    pub total_amount: f64,
    pub payment_status: String,
    pub payment_method: Option<String>,
    pub paid_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderWithDetails {
    #[serde(flatten)]
    pub order: Order,
    pub customer_name: Option<String>,
    pub customer_mobile: Option<String>,
    pub items: Vec<OrderItemWithProduct>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct OrderRow {
    #[sqlx(flatten)]
    pub order: Order,
    pub customer_name: Option<String>,
    pub customer_mobile: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrderItem {
    pub id: i64,
    pub order_id: i64,
    pub product_id: i64,
    pub serving_type: String,
    pub quantity: i64,
    pub price: f64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrderItemWithProduct {
    #[serde(flatten)]
    #[sqlx(flatten)]
    pub item: OrderItem,
    pub product_name: String,
    pub product_image: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Settings {
    pub id: i64,
    pub cafe_name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub open_time: String,
    pub close_time: String,
    pub instagram_link: Option<String>,
    pub description: Option<String>,
    pub our_story_image: Option<String>,
    pub featured_product_ids: Option<String>, // JSON
    pub gallery_items: Option<String>, // JSON
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Notification {
    pub id: i64,
    pub message: String,
    pub order_id: Option<i64>,
    pub is_read: bool,
    pub created_at: DateTime<Local>,
}

// Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub username: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub image_url: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub description: Option<String>,
    pub category_id: i64,
    pub full_plate_price: f64,
    pub half_plate_price: Option<f64>,
    pub half_plate_available: bool,
    pub image_url: Option<String>,
    pub available: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub full_plate_price: Option<f64>,
    pub half_plate_price: Option<f64>,
    pub half_plate_available: Option<bool>,
    pub image_url: Option<String>,
    pub available: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    pub customer_name: Option<String>,
    pub customer_mobile: Option<String>,
    pub table_number: Option<String>,
    pub items: Vec<OrderItemRequest>,
}

#[derive(Debug, Deserialize)]
pub struct OrderItemRequest {
    pub product_id: i64,
    pub serving_type: Option<String>, // "FULL" or "HALF"
    pub quantity: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderRequest {
    pub customer_name: Option<String>,
    pub customer_mobile: Option<String>,
    pub table_number: Option<String>,
    pub items: Option<Vec<OrderItemRequest>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePaymentStatusRequest {
    pub payment_status: String,
    pub payment_method: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTableRequest {
    pub table_number: String,
    pub capacity: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTableRequest {
    pub table_number: Option<String>,
    pub capacity: Option<i64>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerRequest {
    pub name: String,
    pub mobile: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub cafe_name: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub open_time: Option<String>,
    pub close_time: Option<String>,
    pub instagram_link: Option<String>,
    pub description: Option<String>,
    pub our_story_image: Option<String>,
    pub featured_product_ids: Option<Vec<i64>>,
    pub gallery_items: Option<Vec<GalleryItemRequest>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GalleryItemRequest {
    pub src: String,
    pub title: String,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardMetrics {
    pub total_orders: i64,
    pub total_revenue: f64,
    pub pending_orders: i64,
    pub completed_orders: i64,
    pub cancelled_orders: i64,
    pub total_customers: i64,
    pub total_products: i64,
    pub avg_order_value: f64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TopProduct {
    pub product_id: i64,
    pub product_name: String,
    pub total_quantity: i64,
    pub total_revenue: f64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TopCategory {
    pub category_id: i64,
    pub category_name: String,
    pub total_quantity: i64,
    pub total_revenue: f64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesReport {
    pub date: String,
    pub total_orders: i64,
    pub total_revenue: f64,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub content: Vec<T>,
    pub total_elements: i64,
    pub total_pages: i64,
    pub current_page: i64,
    pub page_size: i64,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T, message: &str) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            data: Some(data),
        }
    }
    
    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            message: message.to_string(),
            data: None,
        }
    }
}