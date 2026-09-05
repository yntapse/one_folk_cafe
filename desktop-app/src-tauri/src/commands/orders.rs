use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;
use sqlx::Transaction;
use std::sync::Arc;
use chrono::Local;

#[tauri::command]
    pub async fn get_orders(
        page: Option<i64>,
        size: Option<i64>,
        status: Option<String>,
        payment_status: Option<String>,
        table_number: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<PaginatedResponse<OrderWithDetails>>, String> {
        let db = get_db(&state);
        
        let page = page.unwrap_or(0);
        let size = size.unwrap_or(20);
        let offset = page * size;
        
        let push_filters = |qb: &mut sqlx::QueryBuilder<'_, sqlx::Sqlite>| {
            let mut first = true;
            if let Some(status) = &status {
                if status != "all" {
                    qb.push(if first { " WHERE " } else { " AND " });
                    first = false;
                    qb.push("o.status = ").push_bind(status.clone());
                }
            }
            if let Some(payment_status) = &payment_status {
                if payment_status != "all" {
                    qb.push(if first { " WHERE " } else { " AND " });
                    first = false;
                    qb.push("o.payment_status = ").push_bind(payment_status.clone());
                }
            }
            if let Some(table_number) = &table_number {
                if table_number != "all" {
                    qb.push(if first { " WHERE " } else { " AND " });
                    first = false;
                    qb.push("o.table_number = ").push_bind(table_number.clone());
                }
            }
            if let Some(start_date) = &start_date {
                qb.push(if first { " WHERE " } else { " AND " });
                first = false;
                qb.push("date(o.created_at) >= date(").push_bind(start_date.clone()).push(")");
            }
            if let Some(end_date) = &end_date {
                qb.push(if first { " WHERE " } else { " AND " });
                first = false;
                qb.push("date(o.created_at) <= date(").push_bind(end_date.clone()).push(")");
            }
        };

        // Count total
        let mut count_qb = sqlx::QueryBuilder::new("SELECT COUNT(*) FROM orders o");
        push_filters(&mut count_qb);
        let total: i64 = count_qb.build_query_scalar().fetch_one(db).await
            .map_err(|e| AppError::Database(e).to_string())?;

        // Fetch orders
        let mut orders_qb = sqlx::QueryBuilder::new(
            r#"
            SELECT o.*, c.name as customer_name, c.mobile as customer_mobile
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            "#
        );
        push_filters(&mut orders_qb);
        orders_qb.push(" ORDER BY o.created_at DESC LIMIT ").push_bind(size).push(" OFFSET ").push_bind(offset);

        let orders = orders_qb.build_query_as::<OrderRow>().fetch_all(db).await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Fetch items for each order
        let mut orders_with_items = Vec::new();
        for order in orders {
            let items = sqlx::query_as::<_, OrderItemWithProduct>(
                r#"
                SELECT oi.*, p.name as product_name, p.image_url as product_image
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
                "#
            )
            .bind(order.order.id)
            .fetch_all(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
            
            orders_with_items.push(OrderWithDetails {
                order: order.order,
                customer_name: order.customer_name,
                customer_mobile: order.customer_mobile,
                items,
            });
        }
        
        let total_pages = (total as f64 / size as f64).ceil() as i64;
        
        Ok(ApiResponse::success(
            PaginatedResponse {
                content: orders_with_items,
                total_elements: total,
                total_pages,
                current_page: page,
                page_size: size,
            },
            "Orders fetched"
        ))
    }
    
    #[tauri::command]
    pub async fn get_order(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<OrderWithDetails>, String> {
        let db = get_db(&state);
        
        let order = sqlx::query_as::<_, OrderRow>(
            r#"
            SELECT o.*, c.name as customer_name, c.mobile as customer_mobile
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
            "#
        )
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()).to_string())?;
        
        let items = sqlx::query_as::<_, OrderItemWithProduct>(
            r#"
            SELECT oi.*, p.name as product_name, p.image_url as product_image
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
            "#
        )
        .bind(id)
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let order_with_items = OrderWithDetails {
            order: order.order,
            customer_name: order.customer_name,
            customer_mobile: order.customer_mobile,
            items,
        };
        
        Ok(ApiResponse::success(order_with_items, "Order fetched"))
    }
    
    #[tauri::command]
    pub async fn create_order(
        request: CreateOrderRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<OrderWithDetails>, String> {
        let db = get_db(&state);
        
        let mut tx: Transaction<'_, sqlx::Sqlite> = db.begin().await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Get or create customer
        let customer_id = if let (Some(name), Some(mobile)) = (&request.customer_name, &request.customer_mobile) {
            let customer = sqlx::query_as::<_, Customer>(
                "SELECT * FROM customers WHERE mobile = ?"
            )
            .bind(mobile)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
            
            match customer {
                Some(c) => Some(c.id),
                None => {
                    let result = sqlx::query(
                        "INSERT INTO customers (name, mobile) VALUES (?, ?)"
                    )
                    .bind(name)
                    .bind(mobile)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| AppError::Database(e).to_string())?;
                    Some(result.last_insert_rowid())
                }
            }
        } else {
            None
        };
        
        // Calculate total amount
        let mut total_amount = 0.0_f64;
        let mut order_items_data = Vec::new();
        
        for item_req in &request.items {
            let product = sqlx::query_as::<_, Product>(
                "SELECT * FROM products WHERE id = ? AND is_active = 1 AND available = 1"
            )
            .bind(item_req.product_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| AppError::Database(e).to_string())?
            .ok_or_else(|| AppError::Validation(format!("Product {} not found or unavailable", item_req.product_id)).to_string())?;
            
            let serving_type = item_req.serving_type.as_deref().unwrap_or("FULL");
            let price = match serving_type {
                "HALF" => product.half_plate_price.ok_or_else(|| 
                    AppError::Validation("Half plate not available for this product".to_string()).to_string()
                )?,
                _ => product.full_plate_price,
            };
            
            let item_total = price * item_req.quantity as f64;
            total_amount += item_total;
            
            order_items_data.push((item_req.product_id, serving_type.to_string(), item_req.quantity, price));
        }
        
        // Create order
        let now = Local::now();
        let result = sqlx::query(
            r#"
            INSERT INTO orders (customer_id, table_number, status, total_amount, payment_status, created_at)
            VALUES (?, ?, 'PENDING', ?, 'UNPAID', ?)
            "#
        )
        .bind(customer_id)
        .bind(&request.table_number)
        .bind(total_amount)
        .bind(now)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let order_id = result.last_insert_rowid();
        
        // Create order items
        for (product_id, serving_type, quantity, price) in order_items_data {
            sqlx::query(
                "INSERT INTO order_items (order_id, product_id, serving_type, quantity, price) VALUES (?, ?, ?, ?, ?)"
            )
            .bind(order_id)
            .bind(product_id)
            .bind(serving_type)
            .bind(quantity)
            .bind(price)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        }
        
        // Create notification
        let table_str = request.table_number.as_deref().unwrap_or("Takeaway");
        sqlx::query(
            "INSERT INTO notifications (message, order_id) VALUES (?, ?)"
        )
        .bind(format!("New order #{} for {}", order_id, table_str))
        .bind(order_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        // Update table status if table assigned
        if let Some(table_num) = &request.table_number {
            sqlx::query("UPDATE cafe_tables SET status = 'OCCUPIED' WHERE table_number = ?")
                .bind(table_num)
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
        }
        
        tx.commit().await.map_err(|e| AppError::Database(e).to_string())?;
        
        // Return the created order with details
        get_order(order_id, state).await
    }
    
    #[tauri::command]
    pub async fn update_order(
        id: i64,
        request: UpdateOrderRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<OrderWithDetails>, String> {
        let db = get_db(&state);
        
        let mut tx: Transaction<'_, sqlx::Sqlite> = db.begin().await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Update order basic info
        let mut qb = sqlx::QueryBuilder::new("UPDATE orders SET updated_at = CURRENT_TIMESTAMP");

        if let Some(table_number) = &request.table_number {
            qb.push(", table_number = ").push_bind(table_number.clone());
        }

        qb.push(" WHERE id = ").push_bind(id);
        qb.build().execute(&mut *tx).await.map_err(|e| AppError::Database(e).to_string())?;
        
        // Update items if provided
        if let Some(items) = request.items {
            // Delete existing items
            sqlx::query("DELETE FROM order_items WHERE order_id = ?")
                .bind(id)
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
            
            // Calculate new total
            let mut total_amount = 0.0_f64;
            for item_req in &items {
                let product = sqlx::query_as::<_, Product>(
                    "SELECT * FROM products WHERE id = ? AND is_active = 1 AND available = 1"
                )
                .bind(item_req.product_id)
                .fetch_optional(&mut *tx)
                .await
                .map_err(|e| AppError::Database(e).to_string())?
                .ok_or_else(|| AppError::Validation(format!("Product {} not found or unavailable", item_req.product_id)).to_string())?;
                
                let serving_type = item_req.serving_type.as_deref().unwrap_or("FULL");
                let price = match serving_type {
                    "HALF" => product.half_plate_price.ok_or_else(|| 
                        AppError::Validation("Half plate not available for this product".to_string()).to_string()
                    )?,
                    _ => product.full_plate_price,
                };
                
                let item_total = price * item_req.quantity as f64;
                total_amount += item_total;
                
                sqlx::query(
                    "INSERT INTO order_items (order_id, product_id, serving_type, quantity, price) VALUES (?, ?, ?, ?, ?)"
                )
                .bind(id)
                .bind(item_req.product_id)
                .bind(serving_type)
                .bind(item_req.quantity)
                .bind(price)
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
            }
            
            // Update total amount
            sqlx::query("UPDATE orders SET total_amount = ? WHERE id = ?")
                .bind(total_amount)
                .bind(id)
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
        }
        
        tx.commit().await.map_err(|e| AppError::Database(e).to_string())?;
        
        get_order(id, state).await
    }
    
    #[tauri::command]
    pub async fn update_order_status(
        id: i64,
        request: UpdateOrderStatusRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<OrderWithDetails>, String> {
        let db = get_db(&state);
        
        let valid_statuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
        if !valid_statuses.contains(&request.status.as_str()) {
            return Err(AppError::Validation("Invalid status".to_string()).to_string());
        }
        
        let mut tx: Transaction<'_, sqlx::Sqlite> = db.begin().await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Get current order for table handling
        let order = sqlx::query_as::<_, Order>(
            "SELECT * FROM orders WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()).to_string())?;
        
        // Update status
        sqlx::query("UPDATE orders SET status = ? WHERE id = ?")
            .bind(&request.status)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Handle table status changes
        if let Some(table_number) = &order.table_number {
            let new_table_status = match request.status.as_str() {
                "COMPLETED" | "CANCELLED" => "AVAILABLE",
                "PENDING" | "PREPARING" | "READY" => "OCCUPIED",
                _ => "AVAILABLE",
            };
            
            sqlx::query("UPDATE cafe_tables SET status = ? WHERE table_number = ?")
                .bind(new_table_status)
                .bind(table_number)
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
        }
        
        // Create notification
        sqlx::query(
            "INSERT INTO notifications (message, order_id) VALUES (?, ?)"
        )
        .bind(format!("Order #{} status changed to {}", id, request.status))
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        tx.commit().await.map_err(|e| AppError::Database(e).to_string())?;
        
        get_order(id, state).await
    }
    
    #[tauri::command]
    pub async fn update_payment_status(
        id: i64,
        request: UpdatePaymentStatusRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<OrderWithDetails>, String> {
        let db = get_db(&state);
        
        let valid_payment_statuses = ["UNPAID", "PAID", "PARTIAL", "REFUNDED"];
        if !valid_payment_statuses.contains(&request.payment_status.as_str()) {
            return Err(AppError::Validation("Invalid payment status".to_string()).to_string());
        }
        
        let mut qb = sqlx::QueryBuilder::new("UPDATE orders SET payment_status = ");
        qb.push_bind(request.payment_status.clone());
        qb.push(", updated_at = CURRENT_TIMESTAMP");

        if let Some(payment_method) = &request.payment_method {
            qb.push(", payment_method = ").push_bind(payment_method.clone());
        }

        if request.payment_status == "PAID" {
            qb.push(", paid_at = CURRENT_TIMESTAMP");
        }

        qb.push(" WHERE id = ").push_bind(id);
        qb.build().execute(db).await.map_err(|e| AppError::Database(e).to_string())?;
        
        // Create notification
        sqlx::query(
            "INSERT INTO notifications (message, order_id) VALUES (?, ?)"
        )
        .bind(format!("Order #{} payment status: {}", id, request.payment_status))
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        get_order(id, state).await
    }
    
    #[tauri::command]
    pub async fn delete_order(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<()>, String> {
        let db = get_db(&state);
        
        let mut tx: Transaction<'_, sqlx::Sqlite> = db.begin().await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Get order for table handling
        let order = sqlx::query_as::<_, Order>(
            "SELECT * FROM orders WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()).to_string())?;
        
        // Delete order items (cascade)
        sqlx::query("DELETE FROM order_items WHERE order_id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Delete order
        sqlx::query("DELETE FROM orders WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        // Free up table
        if let Some(table_number) = &order.table_number {
            sqlx::query("UPDATE cafe_tables SET status = 'AVAILABLE' WHERE table_number = ?")
                .bind(table_number)
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
        }
        
        // Delete notifications for this order
        sqlx::query("DELETE FROM notifications WHERE order_id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        tx.commit().await.map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success((), "Order deleted"))
    }
    
    #[tauri::command]
    pub async fn get_order_counts(
        table_number: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<std::collections::HashMap<String, i64>>, String> {
        let db = get_db(&state);
        
        let mut counts = std::collections::HashMap::new();
        
        let statuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
        for status in statuses {
            let mut qb = sqlx::QueryBuilder::new(format!("SELECT COUNT(*) FROM orders WHERE status = '{}'", status));

            if let Some(ref table) = table_number {
                qb.push(" AND table_number = ").push_bind(table.clone());
            }
            if let Some(ref start) = start_date {
                qb.push(" AND date(created_at) >= date(").push_bind(start.clone()).push(")");
            }
            if let Some(ref end) = end_date {
                qb.push(" AND date(created_at) <= date(").push_bind(end.clone()).push(")");
            }

            let count: i64 = qb.build_query_scalar().fetch_one(db).await
                .map_err(|e| AppError::Database(e).to_string())?;

            counts.insert(status.to_string(), count);
        }

        // Payment status counts
        let payment_statuses = ["UNPAID", "PAID", "PARTIAL", "REFUNDED"];
        for status in payment_statuses {
            let mut qb = sqlx::QueryBuilder::new(format!("SELECT COUNT(*) FROM orders WHERE payment_status = '{}'", status));

            if let Some(ref table) = table_number {
                qb.push(" AND table_number = ").push_bind(table.clone());
            }

            let count: i64 = qb.build_query_scalar().fetch_one(db).await
                .map_err(|e| AppError::Database(e).to_string())?;

            counts.insert(format!("payment_{}", status), count);
        }
        
        Ok(ApiResponse::success(counts, "Order counts fetched"))
    }