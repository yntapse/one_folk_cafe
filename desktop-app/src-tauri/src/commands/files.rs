use crate::{models::*, error::*};
use tauri::Manager;
use base64::{Engine as _, engine::general_purpose};
use std::path::Path;
use uuid::Uuid;
use chrono::Local;

#[tauri::command]
    pub async fn save_image(
        file_name: String,
        base64_data: String,
        app_handle: tauri::AppHandle,
    ) -> Result<ApiResponse<String>, String> {
        let data = general_purpose::STANDARD.decode(&base64_data)
            .map_err(|e| AppError::Base64(e).to_string())?;
        
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Internal(e.to_string()).to_string())?
            .join("uploads");
        
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| AppError::Io(e).to_string())?;
        
        let extension = Path::new(&file_name)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("png");
        
        let new_file_name = format!("{}_{}.{}", Uuid::new_v4(), Local::now().timestamp(), extension);
        let file_path = app_data_dir.join(&new_file_name);
        
        std::fs::write(&file_path, &data)
            .map_err(|e| AppError::Io(e).to_string())?;
        
        // Return the file path that can be used as image URL
        let url = format!("file://{}", file_path.display());
        
        Ok(ApiResponse::success(url, "Image saved"))
    }
    
    #[tauri::command]
    pub async fn delete_image(
        file_url: String,
    ) -> Result<ApiResponse<()>, String> {
        // Extract file name from file:// URL
        let file_name = file_url.strip_prefix("file://")
            .ok_or_else(|| AppError::Validation("Invalid file URL".to_string()).to_string())?;
        
        let path = Path::new(file_name);
        if path.exists() {
            std::fs::remove_file(path)
                .map_err(|e| AppError::Io(e).to_string())?;
        }
        
        Ok(ApiResponse::success((), "Image deleted"))
    }