// TEMPORARY: console left enabled in release builds to diagnose a silent startup failure.
// Restore `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` once fixed.

mod commands;
mod database;
mod models;
mod auth;
mod error;

use database::Database;
use std::sync::Arc;
use tauri::Manager;

fn main() {
    println!("[diag] main() starting");
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app.get_webview_window("main").unwrap().set_focus();
        }))
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        .setup(|app| {
            println!("[diag] setup() started");
            let db = Database::new(app.handle().clone());
            println!("[diag] Database::new() ok");
            if let Err(e) = tauri::async_runtime::block_on(db.init()) {
                eprintln!("[diag] db.init() FAILED: {e}");
                return Err(Box::new(e));
            }
            println!("[diag] db.init() ok");
            app.manage(Arc::new(db));
            println!("[diag] state managed; setup complete");

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::login,
            commands::auth::verify_token,
            commands::auth::change_password,
            
            // Categories
            commands::categories::get_categories,
            commands::categories::create_category,
            commands::categories::update_category,
            commands::categories::delete_category,
            
            // Products
            commands::products::get_products,
            commands::products::get_product,
            commands::products::create_product,
            commands::products::update_product,
            commands::products::delete_product,
            commands::products::toggle_product_availability,
            
            // Orders
            commands::orders::get_orders,
            commands::orders::get_order,
            commands::orders::create_order,
            commands::orders::update_order,
            commands::orders::update_order_status,
            commands::orders::update_payment_status,
            commands::orders::delete_order,
            commands::orders::get_order_counts,
            
            // Tables
            commands::tables::get_tables,
            commands::tables::create_table,
            commands::tables::update_table,
            commands::tables::delete_table,
            commands::tables::update_table_status,
            
            // Customers
            commands::customers::get_customers,
            commands::customers::create_customer,
            commands::customers::get_or_create_customer,
            
            // Analytics
            commands::analytics::get_dashboard_metrics,
            commands::analytics::get_top_products,
            commands::analytics::get_top_categories,
            commands::analytics::get_sales_report,
            
            // Settings
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::upload_image,
            
            // Notifications
            commands::notifications::get_notifications,
            commands::notifications::mark_as_read,
            commands::notifications::mark_all_as_read,
            
            // File operations
            commands::files::save_image,
            commands::files::delete_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}