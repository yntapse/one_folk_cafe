use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;

use std::sync::Arc;

#[tauri::command]
    pub async fn get_tables(
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<CafeTable>>, String> {
        let db = get_db(&state);
        
        let tables = sqlx::query_as::<_, CafeTable>(
            "SELECT * FROM cafe_tables ORDER BY CAST(table_number AS INTEGER)"
        )
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(tables, "Tables fetched"))
    }
    
    #[tauri::command]
    pub async fn create_table(
        request: CreateTableRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<CafeTable>, String> {
        let db = get_db(&state);
        
        // Check if table number exists
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM cafe_tables WHERE table_number = ?)"
        )
        .bind(&request.table_number)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        if exists {
            return Err(AppError::Conflict("Table with this number already exists".to_string()).to_string());
        }
        
        let result = sqlx::query(
            "INSERT INTO cafe_tables (table_number, capacity, status) VALUES (?, ?, 'AVAILABLE')"
        )
        .bind(&request.table_number)
        .bind(request.capacity)
        .execute(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let table = sqlx::query_as::<_, CafeTable>(
            "SELECT * FROM cafe_tables WHERE id = ?"
        )
        .bind(result.last_insert_rowid())
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(table, "Table created"))
    }
    
    #[tauri::command]
    pub async fn update_table(
        id: i64,
        request: UpdateTableRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<CafeTable>, String> {
        let db = get_db(&state);
        
        // Check if table exists
        let existing = sqlx::query_as::<_, CafeTable>(
            "SELECT * FROM cafe_tables WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .ok_or_else(|| AppError::NotFound("Table not found".to_string()).to_string())?;
        
        // Check table number conflict if changing
        if let Some(ref table_number) = request.table_number {
            if table_number != &existing.table_number {
                let exists: bool = sqlx::query_scalar(
                    "SELECT EXISTS(SELECT 1 FROM cafe_tables WHERE table_number = ? AND id != ?)"
                )
                .bind(table_number)
                .bind(id)
                .fetch_one(db)
                .await
                .map_err(|e| AppError::Database(e).to_string())?;
                
                if exists {
                    return Err(AppError::Conflict("Table with this number already exists".to_string()).to_string());
                }
            }
        }
        
        let mut qb = sqlx::QueryBuilder::new("UPDATE cafe_tables SET updated_at = CURRENT_TIMESTAMP");

        if let Some(table_number) = request.table_number {
            qb.push(", table_number = ").push_bind(table_number);
        }
        if let Some(capacity) = request.capacity {
            qb.push(", capacity = ").push_bind(capacity);
        }
        if let Some(status) = request.status {
            qb.push(", status = ").push_bind(status);
        }

        qb.push(" WHERE id = ").push_bind(id);
        qb.build().execute(db).await.map_err(|e| AppError::Database(e).to_string())?;
        
        let table = sqlx::query_as::<_, CafeTable>(
            "SELECT * FROM cafe_tables WHERE id = ?"
        )
        .bind(id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(table, "Table updated"))
    }
    
    #[tauri::command]
    pub async fn delete_table(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<()>, String> {
        let db = get_db(&state);
        
        // Check if table has active orders
        let active_orders: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM orders WHERE table_number = (SELECT table_number FROM cafe_tables WHERE id = ?) AND status IN ('PENDING', 'PREPARING', 'READY')"
        )
        .bind(id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        if active_orders > 0 {
            return Err(AppError::Conflict("Cannot delete table with active orders".to_string()).to_string());
        }
        
        sqlx::query("DELETE FROM cafe_tables WHERE id = ?")
            .bind(id)
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success((), "Table deleted"))
    }
    
    #[tauri::command]
    pub async fn update_table_status(
        id: i64,
        status: String,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<CafeTable>, String> {
        let db = get_db(&state);
        
        let valid_statuses = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"];
        if !valid_statuses.contains(&status.as_str()) {
            return Err(AppError::Validation("Invalid table status".to_string()).to_string());
        }
        
        sqlx::query("UPDATE cafe_tables SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(status)
            .bind(id)
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        let table = sqlx::query_as::<_, CafeTable>(
            "SELECT * FROM cafe_tables WHERE id = ?"
        )
        .bind(id)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(table, "Table status updated"))
    }