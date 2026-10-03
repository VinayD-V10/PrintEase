import React, { useState } from 'react';
import {
  FileCode,
  Database,
  Copy,
  Check,
  X,
  Server,
  Shield,
  Layers,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const PhpReferenceModal: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'payment_ctrl' | 'db_config'>('sql');
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- PrintEase - MySQL 8.0+ Database Schema
CREATE DATABASE IF NOT EXISTS printease_db;
USE printease_db;

-- ORDERS TABLE WITH FROZEN PRICE SNAPSHOT
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(30) NOT NULL UNIQUE, -- e.g. PE48291
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(191) NOT NULL,
    file_id VARCHAR(50) NOT NULL,
    page_count INT NOT NULL,
    copies INT NOT NULL DEFAULT 1,
    paper_size ENUM('A4', 'A3') NOT NULL,
    color_type ENUM('BW', 'COLOR') NOT NULL,
    side_type ENUM('SINGLE', 'DOUBLE') NOT NULL,
    binding_type ENUM('NONE', 'SPIRAL', 'STAPLE') NOT NULL,
    -- Price Frozen Snapshot Fields:
    printing_cost DECIMAL(10,2) NOT NULL,
    binding_cost DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    price_locked BOOLEAN NOT NULL DEFAULT TRUE,
    price_locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('UNPAID', 'PAID', 'FAILED') DEFAULT 'UNPAID',
    order_status ENUM('PENDING_PAYMENT', 'PAID', 'PRINTING', 'READY_FOR_PICKUP', 'COMPLETED') DEFAULT 'PENDING_PAYMENT',
    pickup_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- PAYMENTS TABLE (AUDIT & GATEWAY REFERENCES)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gateway_order_id VARCHAR(100) NOT NULL,
    gateway_payment_id VARCHAR(100) NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    payment_method VARCHAR(50) NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;`;

  const paymentPhpCode = `<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

// Atomic payment verification with backend price lock check
class PaymentController {
    public static function verifyPayment(): void {
        header('Content-Type: application/json');
        $input = json_decode(file_get_contents('php://input'), true);

        $pdo = Database::getConnection();

        // 1. Fetch Order with FROZEN PRICE from DB
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_id = :order_id FOR UPDATE");
        $stmt->execute([':order_id' => $input['order_id']]);
        $order = $stmt->fetch();

        // 2. Cryptographic HMAC Signature Verification on Backend
        $secret = getenv('PAYMENT_GATEWAY_SECRET') ?: 'printease_secret_key_2026';
        $payload = $order['order_id'] . '|' . $order['final_amount'] . '|' . $input['gateway_order_id'];
        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        if (!hash_equals($expectedSignature, $input['signature_token'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Payment signature verification failed. Untrusted amount!']);
            return;
        }

        // 3. ATOMIC TRANSACTION: update payment, order status, audit log
        $pdo->beginTransaction();
        try {
            $txnRef = 'TXN_' . strtoupper(bin2hex(random_bytes(6)));

            // Record Payment
            $payStmt = $pdo->prepare("INSERT INTO payments (id, order_id, amount, gateway_order_id, transaction_reference, payment_status, signature_verified) VALUES (?, ?, ?, ?, ?, 'SUCCESS', 1)");
            $payStmt->execute([uniqid('pay_'), $order['order_id'], $order['final_amount'], $input['gateway_order_id'], $txnRef]);

            // Update Order to PAID
            $updStmt = $pdo->prepare("UPDATE orders SET payment_status = 'PAID', order_status = 'PAID' WHERE order_id = ?");
            $updStmt->execute([$order['order_id']]);

            // Commit atomic transaction
            $pdo->commit();
            echo json_encode(['success' => true, 'order_id' => $order['order_id'], 'transaction_reference' => $txnRef]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}`;

  const currentSnippet = activeTab === 'sql' ? sqlCode : paymentPhpCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-800 text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C48B28]/25 text-[#EBC176] border border-[#C48B28]/40 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#EBC176] uppercase tracking-wider block">
                College Project Reference Codebase
              </span>
              <h3 className="text-lg font-bold">
                PrintEase PHP 8+ Architecture & MySQL Schema
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#C48B28]/25 hover:bg-[#C48B28]/40 text-[#FFF5E1] border border-[#C48B28]/50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#FFF5E1]" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-6 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'bg-[#C48B28] text-[#FFF5E1]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>schema.sql (MySQL Relational Tables)</span>
          </button>
          <button
            onClick={() => setActiveTab('payment_ctrl')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payment_ctrl'
                ? 'bg-[#C48B28] text-[#FFF5E1]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>PaymentController.php (PDO & Atomic TX)</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto bg-slate-950/70 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre-wrap">{currentSnippet}</pre>
        </div>

        {/* Explanatory footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            💡 Complete source files are saved in <code className="text-[#EBC176] font-bold">/backend-php/</code> ready for Apache/XAMPP deployment.
          </span>
          <button
            onClick={onClose}
            className="btn-smooth btn-dual-shimmer px-5 py-1.5 text-[#FFF5E1] rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
