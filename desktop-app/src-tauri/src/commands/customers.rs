use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;

use std::sync::Arc;

#[tauri::command]
    pub async fn get_customers(
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<Customer>>, String> {
        let db = get_db(&state);
        
        let customers = sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers ORDER BY created_at DESC"
        )
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(customers, "Customers fetched"))
    }
    
    #[tauri::command]
    pub async fn create_customer(
        request: CreateCustomerRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Customer>, String> {
        let db = get_db(&state);
        
        // Check if mobile exists
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM customers WHERE mobile = ?)"
        )
        .bind(&request.mobile)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        if exists {
            return Err(AppError::Conflict("Customer with this mobile already exists".to_string()).to_string());
        }
        
        let result = sqlx::query(
            "INSERT INTO customers (name, mobile) VALUES (?, ?)"
        )
        .bind(&request.name)
        .bind(&request.mobile)
        .execute(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let customer = sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers WHERE id = ?"
        )
        .bind(result.last_insert_rowid())
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(customer, "Customer created"))
    }
    
    #[tauri::command]
    pub async fn get_or_create_customer(
        name: String,
        mobile: String,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Customer>, String> {
        let db = get_db(&state);
        
        let customer = sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers WHERE mobile = ?"
        )
        .bind(&mobile)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        match customer {
            Some(c) => Ok(ApiResponse::success(c, "Customer found")),
            None => create_customer(CreateCustomerRequest { name, mobile }, state).await,
        }
    }