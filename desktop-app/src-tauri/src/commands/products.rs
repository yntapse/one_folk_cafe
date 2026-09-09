use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;

use std::sync::Arc;

#[tauri::command]
    pub async fn get_products(
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<ProductWithCategory>>, String> {
        let db = get_db(&state);
        
        let products = sqlx::query_as::<_, ProductWithCategory>(
            r#"
                 SELECT p.id, p.name, p.description,
                     CAST(p.full_plate_price AS REAL) AS full_plate_price,
                     CAST(p.half_plate_price AS REAL) AS half_plate_price,
                     p.half_plate_available, p.image_url, p.category_id,
                     p.available, p.is_active, p.created_at, p.updated_at,
                     c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            ORDER BY c.name, p.name
            "#
        )
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(products, "Products fetched"))
    }
    
    #[tauri::command]
    pub async fn get_product(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<ProductWithCategory>, String> {
        let db = get_db(&state);
        
        let product = sqlx::query_as::<_, ProductWithCategory>(
            r#"
                 SELECT p.id, p.name, p.description,
                     CAST(p.full_plate_price AS REAL) AS full_plate_price,
                     CAST(p.half_plate_price AS REAL) AS half_plate_price,
                     p.half_plate_available, p.image_url, p.category_id,
                     p.available, p.is_active, p.created_at, p.updated_at,
                     c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_active = 1
            "#
        )
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Product not found".to_string()).to_string())?;
        
        Ok(ApiResponse::success(product, "Product fetched"))
    }
    
    #[tauri::command]
    pub async fn create_product(
        request: CreateProductRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<ProductWithCategory>, String> {
        let db = get_db(&state);
        
        // Verify category exists
        let category_exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE id = ? AND is_active = 1)"
        )
        .bind(request.category_id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        if !category_exists {
            return Err(AppError::Validation("Category not found".to_string()).to_string());
        }

        if request.name.trim().is_empty() {
            return Err(AppError::Validation("Product name is required".to_string()).to_string());
        }

        if !request.full_plate_price.is_finite() || request.full_plate_price <= 0.0 {
            return Err(AppError::Validation("Full plate price must be greater than zero".to_string()).to_string());
        }

        if let Some(half_plate_price) = request.half_plate_price {
            if !half_plate_price.is_finite() || half_plate_price <= 0.0 {
                return Err(AppError::Validation("Half plate price must be greater than zero".to_string()).to_string());
            }
        }
        
        let result = sqlx::query(
            r#"
            INSERT INTO products (name, description, category_id, full_plate_price, half_plate_price, half_plate_available, image_url, available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&request.name)
        .bind(&request.description)
        .bind(request.category_id)
        .bind(request.full_plate_price)
        .bind(request.half_plate_price)
        .bind(request.half_plate_available)
        .bind(&request.image_url)
        .bind(request.available.unwrap_or(true))
        .execute(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let product = sqlx::query_as::<_, ProductWithCategory>(
            r#"
                 SELECT p.id, p.name, p.description,
                     CAST(p.full_plate_price AS REAL) AS full_plate_price,
                     CAST(p.half_plate_price AS REAL) AS half_plate_price,
                     p.half_plate_available, p.image_url, p.category_id,
                     p.available, p.is_active, p.created_at, p.updated_at,
                     c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
            "#
        )
        .bind(result.last_insert_rowid())
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(product, "Product created"))
    }
    
    #[tauri::command]
    pub async fn update_product(
        id: i64,
        request: UpdateProductRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<ProductWithCategory>, String> {
        let db = get_db(&state);
        
        // Check if product exists
        sqlx::query_scalar::<_, i64>("SELECT id FROM products WHERE id = ?")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Product not found".to_string()).to_string())?;
        
        // Verify category if changing
        if let Some(category_id) = request.category_id {
            let category_exists: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM categories WHERE id = ? AND is_active = 1)"
            )
            .bind(category_id)
            .fetch_one(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
            
            if !category_exists {
                return Err(AppError::Validation("Category not found".to_string()).to_string());
            }
        }
        
        let mut qb = sqlx::QueryBuilder::new("UPDATE products SET updated_at = CURRENT_TIMESTAMP");

        if let Some(name) = request.name {
            qb.push(", name = ").push_bind(name);
        }
        if let Some(description) = request.description {
            qb.push(", description = ").push_bind(description);
        }
        if let Some(category_id) = request.category_id {
            qb.push(", category_id = ").push_bind(category_id);
        }
        if let Some(full_plate_price) = request.full_plate_price {
            qb.push(", full_plate_price = ").push_bind(full_plate_price);
        }
        if let Some(half_plate_price) = request.half_plate_price {
            qb.push(", half_plate_price = ").push_bind(half_plate_price);
        }
        if let Some(half_plate_available) = request.half_plate_available {
            qb.push(", half_plate_available = ").push_bind(half_plate_available);
        }
        if let Some(image_url) = request.image_url {
            qb.push(", image_url = ").push_bind(image_url);
        }
        if let Some(available) = request.available {
            qb.push(", available = ").push_bind(available);
        }

        qb.push(" WHERE id = ").push_bind(id);
        qb.build().execute(db).await.map_err(|e| AppError::Database(e).to_string())?;
        
        let product = sqlx::query_as::<_, ProductWithCategory>(
            r#"
                 SELECT p.id, p.name, p.description,
                     CAST(p.full_plate_price AS REAL) AS full_plate_price,
                     CAST(p.half_plate_price AS REAL) AS half_plate_price,
                     p.half_plate_available, p.image_url, p.category_id,
                     p.available, p.is_active, p.created_at, p.updated_at,
                     c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
            "#
        )
        .bind(id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(product, "Product updated"))
    }
    
    #[tauri::command]
    pub async fn delete_product(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<()>, String> {
        let db = get_db(&state);
        
        // Soft delete - set is_active to false
        sqlx::query("UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(id)
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success((), "Product deleted"))
    }
    
    #[tauri::command]
    pub async fn toggle_product_availability(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<ProductWithCategory>, String> {
        let db = get_db(&state);
        
        let product = sqlx::query_as::<_, Product>(
                r#"
                SELECT p.id, p.name, p.description,
                       CAST(p.full_plate_price AS REAL) AS full_plate_price,
                       CAST(p.half_plate_price AS REAL) AS half_plate_price,
                       p.half_plate_available, p.image_url, p.category_id,
                       p.available, p.is_active, p.created_at, p.updated_at
                FROM products p
                WHERE p.id = ?
                "#
        )
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Product not found".to_string()).to_string())?;
        
        let new_available = !product.available;
        
        sqlx::query("UPDATE products SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(new_available)
            .bind(id)
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        let product = sqlx::query_as::<_, ProductWithCategory>(
            r#"
            SELECT p.id, p.name, p.description,
                   CAST(p.full_plate_price AS REAL) AS full_plate_price,
                   CAST(p.half_plate_price AS REAL) AS half_plate_price,
                   p.half_plate_available, p.image_url, p.category_id,
                   p.available, p.is_active, p.created_at, p.updated_at,
                   c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
            "#
        )
        .bind(id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(product, "Product availability toggled"))
    }