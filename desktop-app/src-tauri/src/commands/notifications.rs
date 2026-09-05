use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;

use std::sync::Arc;

#[tauri::command]
    pub async fn get_notifications(
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Vec<Notification>>, String> {
        let db = get_db(&state);
        
        let notifications = sqlx::query_as::<_, Notification>(
            "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
        )
        .fetch_all(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success(notifications, "Notifications fetched"))
    }
    
    #[tauri::command]
    pub async fn mark_as_read(
        id: i64,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<()>, String> {
        let db = get_db(&state);
        
        sqlx::query("UPDATE notifications SET is_read = 1 WHERE id = ?")
            .bind(id)
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success((), "Notification marked as read"))
    }
    
    #[tauri::command]
    pub async fn mark_all_as_read(
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<()>, String> {
        let db = get_db(&state);
        
        sqlx::query("UPDATE notifications SET is_read = 1 WHERE is_read = 0")
            .execute(db)
            .await
            .map_err(|e| AppError::Database(e).to_string())?;
        
        Ok(ApiResponse::success((), "All notifications marked as read"))
    }