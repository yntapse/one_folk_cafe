use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use tauri::Manager;
use std::sync::Arc;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        // Get the database path from Tauri's SQL plugin
        let db_path = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir")
            .join("cafe.db");
        
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        
        // Use SqliteConnectOptions with a native path (not a URL string) so this
        // works correctly on Windows, where the path contains a drive letter and
        // backslashes that aren't valid inside a "sqlite://" URI.
        let options = SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new().connect_lazy_with(options);
        
        Self { pool }
    }
    
    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
    
    pub async fn init(&self) -> Result<(), sqlx::Error> {
        sqlx::raw_sql(include_str!("../migration/001_create_tables.sql"))
            .execute(&self.pool)
            .await?;
        sqlx::raw_sql(include_str!("../migration/002_create_admin.sql"))
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

// Helper to get database from Tauri state
pub fn get_db<'a>(state: &'a tauri::State<'_, Arc<Database>>) -> &'a SqlitePool {
    state.pool()
}