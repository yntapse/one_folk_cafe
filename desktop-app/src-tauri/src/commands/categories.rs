use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;

use std::sync::Arc;

#[tauri::command]
    pub async fn get_categories(
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<Category>>, String> {
        let db = get_db(&state);
        
        let categories = sqlx::query_as::<_, Category>(
            "SELECT * FROM categories WHERE is_active = 1 ORDER BY name"
        )
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(categories, "Categories fetched"))
    }
    
    #[tauri::command]
    pub async fn create_category(
        request: CreateCategoryRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Category>, String> {
        let db = get_db(&state);
        
        // Check if category name already exists
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE name = ?)"
        )
        .bind(&request.name)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        if exists {
            return Err(AppError::Conflict("Category with this name already exists".to_string()).to_string());
        }
        
        let result = sqlx::query(
            "INSERT INTO categories (name, image_url) VALUES (?, ?)"
        )
        .bind(&request.name)
        .bind(&request.image_url)
        .execute(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let category = sqlx::query_as::<_, Category>(
            "SELECT * FROM categories WHERE id = ?"
        )
        .bind(result.last_insert_rowid())
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(category, "Category created"))
    }
    
    #[tauri::command]
    pub async fn update_category(
        id: i64,
        request: UpdateCategoryRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Category>, String> {
        let db = get_db(&state);
        
        // Check if category exists
        let existing = sqlx::query_as::<_, Category>(
            "SELECT * FROM categories WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Category not found".to_string()).to_string())?;
        
        // Check name conflict if changing name
        if let Some(ref name) = request.name {
            if name != &existing.name {
                let exists: bool = sqlx::query_scalar(
                    "SELECT EXISTS(SELECT 1 FROM categories WHERE name = ? AND id != ?)"
                )
                .bind(name)
                .bind(id)
                .fetch_one(db)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
                
                if exists {
                    return Err(AppError::Conflict("Category with this name already exists".to_string()).to_string());
                }
            }
        }
        
        let mut qb = sqlx::QueryBuilder::new("UPDATE categories SET updated_at = CURRENT_TIMESTAMP");

        if let Some(name) = request.name {
            qb.push(", name = ").push_bind(name);
        }
        if let Some(image_url) = request.image_url {
            qb.push(", image_url = ").push_bind(image_url);
        }
        if let Some(is_active) = request.is_active {
            qb.push(", is_active = ").push_bind(is_active);
        }

        qb.push(" WHERE id = ").push_bind(id);
        qb.build().execute(db).await.map_err(|e| AppError::Database(e).to_string())?;
        
        let category = sqlx::query_as::<_, Category>(
            "SELECT * FROM categories WHERE id = ?"
        )
        .bind(id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(category, "Category updated"))
    }
    
    #[tauri::command]
    pub async fn delete_category(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<()>, String> {
        let db = get_db(&state);
        
        // Check if category has products
        let product_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM products WHERE category_id = ?"
        )
        .bind(id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        if product_count > 0 {
            return Err(AppError::Conflict("Cannot delete category with existing products".to_string()).to_string());
        }
        
        sqlx::query("DELETE FROM categories WHERE id = ?")
            .bind(id)
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success((), "Category deleted"))
    }