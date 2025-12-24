<?php
require_once 'vendor/autoload.php';

use Dotenv\Dotenv;
use Predis\Client as RedisClient;

// Load environment variables
if (file_exists('.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Database connection
$dbConnection = false;
$mysqlVersion = null;

try {
    $host = $_ENV['DB_HOST'] ?? 'mysql';
    $dbname = $_ENV['DB_NAME'] ?? 'devdb';
    $username = $_ENV['DB_USER'] ?? 'user';
    $password = $_ENV['DB_PASS'] ?? 'password';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test connection
    $stmt = $pdo->query('SELECT VERSION() as version');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $mysqlVersion = $result['version'];
    $dbConnection = true;
} catch (PDOException $e) {
    $dbError = $e->getMessage();
}

// Redis connection
$redisConnection = false;
$redisInfo = null;

try {
    $redisClient = new RedisClient([
        'scheme' => 'tcp',
        'host'   => 'redis',
        'port'   => 6379,
    ]);
    
    $redisClient->ping();
    $redisInfo = $redisClient->info();
    $redisConnection = true;
} catch (Exception $e) {
    $redisError = $e->getMessage();
}

// Simple routing
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

switch ($path) {
    case '/health':
        echo json_encode([
            'service' => 'PHP Backend',
            'version' => '1.0.0',
            'php_version' => PHP_VERSION,
            'timestamp' => date('c'),
            'database' => [
                'mysql' => $dbConnection ? 'Connected' : 'Disconnected',
                'mysql_version' => $mysqlVersion,
                'redis' => $redisConnection ? 'Connected' : 'Disconnected'
            ]
        ]);
        break;
        
    case '/api/users':
        if ($requestMethod === 'GET') {
            if (!$dbConnection) {
                http_response_code(503);
                echo json_encode(['error' => 'Database not connected']);
                break;
            }
            
            try {
                // Create users table if it doesn't exist
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ");
                
                $stmt = $pdo->query('SELECT * FROM users LIMIT 10');
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($users);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
        } elseif ($requestMethod === 'POST') {
            if (!$dbConnection) {
                http_response_code(503);
                echo json_encode(['error' => 'Database not connected']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['name']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and email are required']);
                break;
            }
            
            try {
                $stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (?, ?)');
                $stmt->execute([$input['name'], $input['email']]);
                
                $userId = $pdo->lastInsertId();
                $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                http_response_code(201);
                echo json_encode($user);
            } catch (PDOException $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
        }
        break;
        
    case '/api/redis/test':
        if (!$redisConnection) {
            http_response_code(503);
            echo json_encode(['error' => 'Redis not connected']);
            break;
        }
        
        try {
            $redisClient->set('php-test-key', 'Hello from PHP!');
            $value = $redisClient->get('php-test-key');
            
            echo json_encode([
                'message' => 'Redis connection successful',
                'testValue' => $value,
                'server_info' => $redisInfo['server'] ?? 'Unknown'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
        break;
}
?>