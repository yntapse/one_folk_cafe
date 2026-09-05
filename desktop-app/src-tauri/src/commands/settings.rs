use crate::{database::{get_db, Database}, models::*, error::*};
use tauri::State;

use std::sync::Arc;
use chrono::Local;

#[tauri::command]
    pub async fn get_settings(
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Settings>, String> {
        let db = get_db(&state);
        
        let settings = sqlx::query_as::<_, Settings>(
            "SELECT * FROM settings WHERE id = 1"
        )
        .fetch_optional(db)
        .await
        .map_err(|e| AppError::Database(e).to_string())?
        .unwrap_or_else(|| Settings {
            id: 1,
            cafe_name: "One Folk Cafe".to_string(),
            address: None,
            phone: None,
            email: None,
            open_time: "08:00".to_string(),
            close_time: "22:00".to_string(),
            instagram_link: None,
            description: None,
            our_story_image: None,
            featured_product_ids: None,
            gallery_items: None,
            created_at: Local::now(),
            updated_at: Local::now(),
        });
        
        Ok(ApiResponse::success(settings, "Settings fetched"))
    }
    
    #[tauri::command]
    pub async fn update_settings(
        request: UpdateSettingsRequest,
        state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<Settings>, String> {
        let db = get_db(&state);
        
        let featured_ids = request.featured_product_ids.map(|ids| serde_json::to_string(&ids).unwrap());
        let gallery = request.gallery_items.map(|items| serde_json::to_string(&items).unwrap());
        
        let mut qb = sqlx::QueryBuilder::new("UPDATE settings SET updated_at = CURRENT_TIMESTAMP");

        if let Some(cafe_name) = request.cafe_name {
            qb.push(", cafe_name = ").push_bind(cafe_name);
        }
        if let Some(address) = request.address {
            qb.push(", address = ").push_bind(address);
        }
        if let Some(phone) = request.phone {
            qb.push(", phone = ").push_bind(phone);
        }
        if let Some(email) = request.email {
            qb.push(", email = ").push_bind(email);
        }
        if let Some(open_time) = request.open_time {
            qb.push(", open_time = ").push_bind(open_time);
        }
        if let Some(close_time) = request.close_time {
            qb.push(", close_time = ").push_bind(close_time);
        }
        if let Some(instagram_link) = request.instagram_link {
            qb.push(", instagram_link = ").push_bind(instagram_link);
        }
        if let Some(description) = request.description {
            qb.push(", description = ").push_bind(description);
        }
        if let Some(our_story_image) = request.our_story_image {
            qb.push(", our_story_image = ").push_bind(our_story_image);
        }
        if let Some(featured_product_ids) = featured_ids {
            qb.push(", featured_product_ids = ").push_bind(featured_product_ids);
        }
        if let Some(gallery_items) = gallery {
            qb.push(", gallery_items = ").push_bind(gallery_items);
        }

        qb.push(" WHERE id = 1");
        qb.build().execute(db).await.map_err(|e| AppError::Database(e).to_string())?;
        
        get_settings(state).await
    }
    
    #[tauri::command]
    pub async fn upload_image(
        file_name: String,
        base64_data: String,
        _state: State<'_, Arc<Database>>,
    ) -> Result<ApiResponse<String>, String> {
        use base64::{Engine as _, engine::general_purpose};
        use std::path::Path;

        let data = general_purpose::STANDARD.decode(&base64_data)
            .map_err(|e| AppError::Base64(e).to_string())?;
        
        // Save to app data directory
        let app_data_dir = std::env::current_dir().unwrap().join("data").join("uploads");
        std::fs::create_dir_all(&app_data_dir).map_err(|e| AppError::Io(e).to_string())?;
        
        let extension = Path::new(&file_name)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("png");
        
        let new_file_name = format!("{}_{}.{}", uuid::Uuid::new_v4(), chrono::Local::now().timestamp(), extension);
        let file_path = app_data_dir.join(&new_file_name);
        
        std::fs::write(&file_path, &data).map_err(|e| AppError::Io(e).to_string())?;
        
        // Return the relative path that can be served
        let url = format!("/uploads/{}", new_file_name);
        
        Ok(ApiResponse::success(url, "Image uploaded"))
    }