-- =====================================================
-- PrintEase - Online Xerox & Printing Service Database Schema
-- MySQL 8.0+ / MariaDB 10.5+
-- =====================================================

CREATE DATABASE IF NOT EXISTS printease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE printease_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin', 'staff') NOT NULL DEFAULT 'customer',
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. PRICING TABLE (Admin configurable)
CREATE TABLE IF NOT EXISTS pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    a4_bw DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    a4_color DECIMAL(8,2) NOT NULL DEFAULT 5.00,
    a3_bw DECIMAL(8,2) NOT NULL DEFAULT 3.00,
    a3_color DECIMAL(8,2) NOT NULL DEFAULT 10.00,
    spiral_binding DECIMAL(8,2) NOT NULL DEFAULT 30.00,
    stapling DECIMAL(8,2) NOT NULL DEFAULT 5.00,
    lamination DECIMAL(8,2) NOT NULL DEFAULT 10.00,
    urgent_fee DECIMAL(8,2) NOT NULL DEFAULT 20.00,
    delivery_fee DECIMAL(8,2) NOT NULL DEFAULT 40.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default pricing
INSERT INTO pricing (id, a4_bw, a4_color, a3_bw, a3_color, spiral_binding, stapling, lamination, urgent_fee, delivery_fee)
VALUES (1, 1.00, 5.00, 3.00, 10.00, 30.00, 5.00, 10.00, 20.00, 40.00)
ON DUPLICATE KEY UPDATE id=1;

-- 3. UPLOADED FILES TABLE (Private secure storage outside public webroot)
CREATE TABLE IF NOT EXISTS uploaded_files (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INT NOT NULL DEFAULT 1,
    upload_status ENUM('uploaded', 'processed', 'archived') NOT NULL DEFAULT 'uploaded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    INDEX idx_file_user (user_id),
    CONSTRAINT fk_file_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ORDERS TABLE (Includes frozen price snapshot)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(30) NOT NULL UNIQUE, -- e.g. PE48291
    user_id VARCHAR(50) NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(191) NOT NULL,
    customer_phone VARCHAR(30),
    file_id VARCHAR(50) NOT NULL,
    page_count INT NOT NULL,
    copies INT NOT NULL DEFAULT 1,
    paper_size ENUM('A4', 'A3') NOT NULL DEFAULT 'A4',
    color_type ENUM('BW', 'COLOR') NOT NULL DEFAULT 'BW',
    side_type ENUM('SINGLE', 'DOUBLE') NOT NULL DEFAULT 'SINGLE',
    orientation ENUM('PORTRAIT', 'LANDSCAPE') NOT NULL DEFAULT 'PORTRAIT',
    binding_type ENUM('NONE', 'SPIRAL', 'STAPLE') NOT NULL DEFAULT 'NONE',
    lamination BOOLEAN NOT NULL DEFAULT FALSE,
    urgency ENUM('NORMAL', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    collection_type ENUM('PICKUP', 'DELIVERY') NOT NULL DEFAULT 'PICKUP',
    delivery_address TEXT NULL,
    special_instructions TEXT NULL,
    -- Locked Price Snapshot fields:
    printing_cost DECIMAL(10,2) NOT NULL,
    binding_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    lamination_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    urgency_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    price_locked BOOLEAN NOT NULL DEFAULT TRUE,
    price_locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('UNPAID', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    order_status ENUM('PENDING_PAYMENT', 'PAID', 'RECEIVED', 'PRINTING', 'BINDING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    pickup_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ready_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    INDEX idx_order_human_id (order_id),
    INDEX idx_order_user (user_id),
    INDEX idx_order_status (order_status),
    INDEX idx_payment_status (payment_status),
    CONSTRAINT fk_order_file FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(50) NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gateway_order_id VARCHAR(100) NOT NULL,
    gateway_payment_id VARCHAR(100) NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL DEFAULT 'SUCCESS',
    signature_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pay_order (order_id),
    INDEX idx_pay_txn (transaction_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(30) NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(150) NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_history_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    recipient_role ENUM('customer', 'owner', 'all') NOT NULL,
    recipient_email VARCHAR(191) NULL,
    order_id VARCHAR(30) NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_role (recipient_role),
    INDEX idx_notif_email (recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    order_id VARCHAR(30) NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_order (order_id),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
