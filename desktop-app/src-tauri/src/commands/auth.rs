use crate::{database::{get_db, Database}, models::*, error::*, auth::*};
use tauri::State;

use std::sync::Arc;

#[tauri::command]
    pub async fn login(
        request: LoginRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<LoginResponse>, String> {
        let db = get_db(&state);
        
        let admin = sqlx::query_as::<_, Admin>(
            "SELECT * FROM admins WHERE username = ?"
        )
        .bind(&request.username)
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let admin = admin.ok_or_else(|| AppError::Auth("Invalid username or password".to_string()).to_string())?;
        
        let valid = verify_password(&request.password, &admin.password_hash)
            .map_err(|e| AppError::Internal(e.to_string()).to_string())?;
        
        if !valid {
            return Err(AppError::Auth("Invalid username or password".to_string()).to_string());
        }
        
        let token = create_token(&admin.username, &admin.role)
            .map_err(|e| AppError::Internal(e.to_string()).to_string())?;
        
        Ok(ApiResponse::success(
            LoginResponse {
                token,
                username: admin.username,
                role: admin.role,
            },
            "Login successful"
        ))
    }
    
    #[tauri::command]
    pub async fn verify_token(
        token: String,
        _state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Claims>, String> {
        let claims = validate_token(&token)
            .map_err(|e| AppError::Auth(e.to_string()).to_string())?;
        
        Ok(ApiResponse::success(claims, "Token valid"))
    }
    
    #[tauri::command]
    pub async fn change_password(
        current_password: String,
        new_password: String,
        token: String,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<()>, String> {
        let claims = validate_token(&token)
            .map_err(|e| AppError::Auth(e.to_string()).to_string())?;
        
        let db = get_db(&state);
        
        let admin = sqlx::query_as::<_, Admin>(
            "SELECT * FROM admins WHERE username = ?"
        )
        .bind(&claims.sub)
        .fetch_one(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        let valid = verify_password(&current_password, &admin.password_hash)
            .map_err(|e| AppError::Internal(e.to_string()).to_string())?;
        
        if !valid {
            return Err(AppError::Auth("Current password is incorrect".to_string()).to_string());
        }
        
        let new_hash = hash_password(&new_password)
            .map_err(|e| AppError::Internal(e.to_string()).to_string())?;
        
        sqlx::query("UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(&new_hash)
            .bind(admin.id)
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success((), "Password changed successfully"))
    }