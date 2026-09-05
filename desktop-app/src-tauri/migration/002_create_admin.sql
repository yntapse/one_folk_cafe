-- 002_create_admin.sql
-- Default admin user (password: admin123)
-- bcrypt hash for "admin123" with cost 12
INSERT OR IGNORE INTO admins (username, password_hash, role) 
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'ADMIN');

-- Default settings
INSERT OR IGNORE INTO settings (id, cafe_name, address, phone, email, open_time, close_time, description)
VALUES (1, 'One Folk Cafe', '123 Main Street, City', '+91-9876543210', 'info@onefolkcafe.com', '08:00', '22:00', 'Welcome to One Folk Cafe, where great food meets great company.');

-- Sample categories
INSERT OR IGNORE INTO categories (id, name, image_url) VALUES
(1, 'Coffee', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400'),
(2, 'Tea', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=400'),
(3, 'Snacks', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?q=80&w=400'),
(4, 'Desserts', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=400'),
(5, 'Beverages', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=400');

-- Sample products
INSERT OR IGNORE INTO products (id, name, description, full_plate_price, half_plate_price, half_plate_available, image_url, category_id, available) VALUES
(1, 'Cappuccino', 'Rich espresso with steamed milk and foam', 120.00, 80.00, 1, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=400', 1, 1),
(2, 'Latte', 'Smooth espresso with steamed milk', 130.00, 85.00, 1, 'https://images.unsplash.com/photo-1561047029-3000c68339ca?q=80&w=400', 1, 1),
(3, 'Espresso', 'Strong and bold coffee shot', 90.00, NULL, 0, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=400', 1, 1),
(4, 'Masala Chai', 'Traditional Indian spiced tea', 60.00, 40.00, 1, 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?q=80&w=400', 2, 1),
(5, 'Green Tea', 'Refreshing green tea', 50.00, NULL, 0, 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=400', 2, 1),
(6, 'Veg Sandwich', 'Grilled vegetable sandwich with cheese', 180.00, 100.00, 1, 'https://images.unsplash.com/photo-1603046891740-4d1a615a90c6?q=80&w=400', 3, 1),
(7, 'French Fries', 'Crispy golden french fries', 120.00, 70.00, 1, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400', 3, 1),
(8, 'Chocolate Brownie', 'Warm chocolate brownie with ice cream', 150.00, NULL, 0, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400', 4, 1),
(9, 'Cheesecake', 'Classic New York cheesecake', 180.00, NULL, 0, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=400', 4, 1),
(10, 'Cold Coffee', 'Chilled coffee with ice cream', 140.00, 90.00, 1, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=400', 5, 1),
(11, 'Fresh Lime Soda', 'Refreshing lime soda', 70.00, NULL, 0, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400', 5, 1);

-- Sample tables
INSERT OR IGNORE INTO cafe_tables (id, table_number, capacity, status) VALUES
(1, 'T1', 2, 'AVAILABLE'),
(2, 'T2', 4, 'AVAILABLE'),
(3, 'T3', 4, 'AVAILABLE'),
(4, 'T4', 6, 'AVAILABLE'),
(5, 'T5', 2, 'AVAILABLE'),
(6, 'T6', 4, 'AVAILABLE');