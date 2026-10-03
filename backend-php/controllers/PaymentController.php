<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

/**
 * PrintEase - Payment & Price Freeze Controller
 * Strictly verifies transactions on backend; never trusts frontend amounts
 */
class PaymentController {

    public static function verifyPayment(): void {
        header('Content-Type: application/json');
        
        $input = json_decode(file_get_contents('php://input'), true);
        $orderId = trim($input['order_id'] ?? '');
        $gatewayOrderId = trim($input['gateway_order_id'] ?? '');
        $signatureToken = trim($input['signature_token'] ?? '');
        $paymentMethod = trim($input['payment_method'] ?? 'UPI');

        if (empty($orderId) || empty($gatewayOrderId) || empty($signatureToken)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing critical payment verification parameters.']);
            return;
        }

        $pdo = Database::getConnection();

        // 1. Fetch Order with FROZEN PRICE from DB
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_id = :order_id FOR UPDATE");
        $stmt->execute([':order_id' => $orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Order not found.']);
            return;
        }

        // 2. Cryptographic Server-Side Signature Verification
        $secret = getenv('PAYMENT_GATEWAY_SECRET') ?: 'printease_secure_gateway_secret_key_2026';
        $payload = $order['order_id'] . '|' . $order['final_amount'] . '|' . $gatewayOrderId;
        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        if (!hash_equals($expectedSignature, $signatureToken)) {
            // Log security breach attempt
            $logStmt = $pdo->prepare("INSERT INTO audit_logs (user_name, user_role, action, order_id, details, ip_address) VALUES (:name, 'system', 'PAYMENT_FRAUD_ALERT', :order_id, 'Signature tampering detected', :ip)");
            $logStmt->execute([
                ':name' => $order['customer_name'],
                ':order_id' => $orderId,
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            http_response_code(400);
            echo json_encode(['error' => 'Invalid payment signature. Verification failed.']);
            return;
        }

        // 3. ATOMIC DATABASE TRANSACTION
        try {
            $pdo->beginTransaction();

            $txnRef = 'TXN_' . strtoupper(bin2hex(random_bytes(6)));
            $paymentId = 'pay_' . time() . '_' . bin2hex(random_bytes(4));

            // Record Payment
            $payStmt = $pdo->prepare("INSERT INTO payments (id, order_id, user_id, amount, currency, gateway_order_id, gateway_payment_id, transaction_reference, payment_method, payment_status, signature_verified) VALUES (:id, :order_id, :user_id, :amount, 'INR', :gateway_order_id, :gateway_pay_id, :txn_ref, :method, 'SUCCESS', 1)");
            $payStmt->execute([
                ':id' => $paymentId,
                ':order_id' => $order['order_id'],
                ':user_id' => $order['user_id'],
                ':amount' => $order['final_amount'],
                ':gateway_order_id' => $gatewayOrderId,
                ':gateway_pay_id' => $paymentId,
                ':txn_ref' => $txnRef,
                ':method' => $paymentMethod
            ]);

            // Mark Order as PAID
            $updStmt = $pdo->prepare("UPDATE orders SET payment_status = 'PAID', order_status = 'PAID', updated_at = NOW() WHERE order_id = :order_id");
            $updStmt->execute([':order_id' => $orderId]);

            // Notify Owner
            $notifStmt = $pdo->prepare("INSERT INTO notifications (id, recipient_role, order_id, title, message, type) VALUES (:id, 'owner', :order_id, :title, :msg, 'order_new')");
            $notifStmt->execute([
                ':id' => 'notif_' . bin2hex(random_bytes(6)),
                ':order_id' => $orderId,
                ':title' => "🖨️ New Paid Order: #{$orderId}",
                ':msg' => "Customer {$order['customer_name']} paid ₹{$order['final_amount']} for file {$order['file_id']}. Ready for Xerox printing."
            ]);

            // Audit log
            $auditStmt = $pdo->prepare("INSERT INTO audit_logs (user_name, user_role, action, order_id, details, ip_address) VALUES (:name, 'customer', 'PAYMENT_VERIFIED', :order_id, :details, :ip)");
            $auditStmt->execute([
                ':name' => $order['customer_name'],
                ':order_id' => $orderId,
                ':details' => "Payment verified via {$paymentMethod}. Amount ₹{$order['final_amount']}. Ref: {$txnRef}",
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'order_id' => $orderId,
                'amount' => $order['final_amount'],
                'transaction_reference' => $txnRef,
                'payment_status' => 'PAID',
                'pickup_code' => $order['pickup_code']
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Database transaction failed: ' . $e->getMessage()]);
        }
    }
}
