use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;

use std::sync::Arc;
use chrono::Local;

#[tauri::command]
    pub async fn get_dashboard_metrics(
        filter: Option<String>, // "daily", "weekly", "monthly", "yearly"
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<DashboardMetrics>, String> {
        let db = get_db(&state);
        
        let filter = filter.unwrap_or_else(|| "monthly".to_string());
        let now = Local::now();
        
        let date_filter = match filter.as_str() {
            "daily" => format!("date(created_at) = date('{}')", now.format("%Y-%m-%d")),
            "weekly" => format!("date(created_at) >= date('{}', '-6 days')", now.format("%Y-%m-%d")),
            "monthly" => format!("strftime('%Y-%m', created_at) = '{}'", now.format("%Y-%m")),
            "yearly" => format!("strftime('%Y', created_at) = '{}'", now.format("%Y")),
            _ => format!("strftime('%Y-%m', created_at) = '{}'", now.format("%Y-%m")),
        };
        
        let total_orders: i64 = sqlx::query_scalar(&format!(
            "SELECT COUNT(*) FROM orders WHERE {}",
            date_filter
        ))
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let total_revenue: Option<f64> = sqlx::query_scalar(&format!(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE {} AND payment_status = 'PAID'",
            date_filter
        ))
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let pending_orders: i64 = sqlx::query_scalar(&format!(
            "SELECT COUNT(*) FROM orders WHERE {} AND status = 'PENDING'",
            date_filter
        ))
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let completed_orders: i64 = sqlx::query_scalar(&format!(
            "SELECT COUNT(*) FROM orders WHERE {} AND status = 'COMPLETED'",
            date_filter
        ))
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let cancelled_orders: i64 = sqlx::query_scalar(&format!(
            "SELECT COUNT(*) FROM orders WHERE {} AND status = 'CANCELLED'",
            date_filter
        ))
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let total_customers: i64 = sqlx::query_scalar(&format!(
            "SELECT COUNT(*) FROM customers WHERE {}",
            date_filter.replace("created_at", "created_at")
        ))
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let total_products: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM products WHERE is_active = 1"
        )
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let avg_order_value = if total_orders > 0 {
            total_revenue.unwrap_or(0.0) / total_orders as f64
        } else {
            0.0
        };

        Ok(ApiResponse::success(
            DashboardMetrics {
                total_orders,
                total_revenue: total_revenue.unwrap_or(0.0),
                pending_orders,
                completed_orders,
                cancelled_orders,
                total_customers,
                total_products,
                avg_order_value,
            },
            "Dashboard metrics fetched"
        ))
    }
    
    #[tauri::command]
    pub async fn get_top_products(
        filter: Option<String>,
        limit: Option<i64>,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<TopProduct>>, String> {
        let db = get_db(&state);
        
        let filter = filter.unwrap_or_else(|| "monthly".to_string());
        let limit = limit.unwrap_or(10);
        let now = Local::now();
        
        let date_filter = match filter.as_str() {
            "daily" => format!("date(o.created_at) = date('{}')", now.format("%Y-%m-%d")),
            "weekly" => format!("date(o.created_at) >= date('{}', '-6 days')", now.format("%Y-%m-%d")),
            "monthly" => format!("strftime('%Y-%m', o.created_at) = '{}'", now.format("%Y-%m")),
            "yearly" => format!("strftime('%Y', o.created_at) = '{}'", now.format("%Y")),
            _ => format!("strftime('%Y-%m', o.created_at) = '{}'", now.format("%Y-%m")),
        };
        
        let products = sqlx::query_as::<_, TopProduct>(
            &format!(
                r#"
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    COALESCE(SUM(oi.quantity), 0) as total_quantity,
                    COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
                FROM products p
                JOIN order_items oi ON p.id = oi.product_id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.payment_status = 'PAID' AND {}
                GROUP BY p.id, p.name
                ORDER BY total_revenue DESC
                LIMIT ?
                "#,
                date_filter
            )
        )
        .bind(limit)
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(products, "Top products fetched"))
    }
    
    #[tauri::command]
    pub async fn get_top_categories(
        filter: Option<String>,
        limit: Option<i64>,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<TopCategory>>, String> {
        let db = get_db(&state);
        
        let filter = filter.unwrap_or_else(|| "monthly".to_string());
        let limit = limit.unwrap_or(10);
        let now = Local::now();
        
        let date_filter = match filter.as_str() {
            "daily" => format!("date(o.created_at) = date('{}')", now.format("%Y-%m-%d")),
            "weekly" => format!("date(o.created_at) >= date('{}', '-6 days')", now.format("%Y-%m-%d")),
            "monthly" => format!("strftime('%Y-%m', o.created_at) = '{}'", now.format("%Y-%m")),
            "yearly" => format!("strftime('%Y', o.created_at) = '{}'", now.format("%Y")),
            _ => format!("strftime('%Y-%m', o.created_at) = '{}'", now.format("%Y-%m")),
        };
        
        let categories = sqlx::query_as::<_, TopCategory>(
            &format!(
                r#"
                SELECT 
                    c.id as category_id,
                    c.name as category_name,
                    COALESCE(SUM(oi.quantity), 0) as total_quantity,
                    COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
                FROM categories c
                JOIN products p ON c.id = p.category_id
                JOIN order_items oi ON p.id = oi.product_id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.payment_status = 'PAID' AND {}
                GROUP BY c.id, c.name
                ORDER BY total_revenue DESC
                LIMIT ?
                "#,
                date_filter
            )
        )
        .bind(limit)
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(categories, "Top categories fetched"))
    }
    
    #[tauri::command]
    pub async fn get_sales_report(
        filter: Option<String>, // "daily", "weekly", "monthly"
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<SalesReport>>, String> {
        let db = get_db(&state);
        
        let filter = filter.unwrap_or_else(|| "monthly".to_string());
        let now = Local::now();
        
        let (group_by, date_format, limit_days) = match filter.as_str() {
            "daily" => ("date(created_at)", "%Y-%m-%d", 30),
            "weekly" => ("strftime('%Y-%W', created_at)", "%Y-%W", 12),
            "monthly" => ("strftime('%Y-%m', created_at)", "%Y-%m", 12),
            _ => ("strftime('%Y-%m', created_at)", "%Y-%m", 12),
        };
        
        let report = sqlx::query_as::<_, SalesReport>(
            &format!(
                r#"
                SELECT 
                    strftime('{}', created_at) as date,
                    COUNT(*) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_revenue
                FROM orders
                WHERE payment_status = 'PAID'
                AND date(created_at) >= date('{}', '-{} days')
                GROUP BY {}
                ORDER BY date DESC
                "#,
                date_format,
                now.format("%Y-%m-%d"),
                limit_days,
                group_by
            )
        )
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(report, "Sales report fetched"))
    }