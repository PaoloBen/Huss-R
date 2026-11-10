<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbFile = __DIR__ . '/hussr_database.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbFile);$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create Real Tables for Users, Character Vault, and Global Leaderboard
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            password_hash TEXT,
            state_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            owner_email TEXT NOT NULL,
            char_name TEXT NOT NULL,
            limbs_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            speed INTEGER NOT NULL,
            distance INTEGER NOT NULL,
            score INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
    ");
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Database init failed: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($action === 'register') {
    $email = strtolower(trim($input['email'] ?? ''));
    $name = trim($input['name'] ?? 'Sprinter');
    $passHash =$input['passwordHash'] ?? '';
    $stateJson = json_encode($input['state'] ?? []);

    $stmt =$pdo->prepare("SELECT email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['ok' => false, 'error' => 'Email already registered. Please Login instead.']);
        exit;
    }

    $ins =$pdo->prepare("INSERT INTO users (email, name, password_hash, state_json, updated_at) VALUES (?, ?, ?, ?, ?)");
    $ins->execute([$email,$name, $passHash,$stateJson, time()]);
    echo json_encode(['ok' => true, 'user' => ['email' => $email, 'name' => $name], 'state' => json_decode($stateJson, true)]);
    exit;
}

if ($action === 'login') {
    $email = strtolower(trim($input['email'] ?? ''));
    $passHash =$input['passwordHash'] ?? '';
    $isOAuth = !empty($input['isOAuth']);

    $stmt =$pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row =$stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        if ($isOAuth) {
            $name = trim($input['name'] ?? 'Google Runner');
            $stateJson = json_encode($input['state'] ?? []);
            $ins =$pdo->prepare("INSERT INTO users (email, name, password_hash, state_json, updated_at) VALUES (?, ?, '', ?, ?)");
            $ins->execute([$email, $name,$stateJson, time()]);
            echo json_encode(['ok' => true, 'user' => ['email' => $email, 'name' => $name], 'state' => json_decode($stateJson, true)]);
            exit;
        }
        echo json_encode(['ok' => false, 'error' => 'Account not found. Please Sign Up first.']);
        exit;
    }

    if (!$isOAuth && $row['password_hash'] !==$passHash) {
        echo json_encode(['ok' => false, 'error' => 'Incorrect password for this account.']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'user' => ['email' => $row['email'], 'name' =>$row['name']],
        'state' => json_decode($row['state_json'], true)
    ]);
    exit;
}

if ($action === 'sync_state') {
    $email = strtolower(trim($input['email'] ?? ''));
    $stateJson = json_encode($input['state'] ?? []);
    $upd =$pdo->prepare("UPDATE users SET state_json = ?, updated_at = ? WHERE email = ?");
    $upd->execute([$stateJson, time(),$email]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'save_character') {
    $id =$input['id'] ?? uniqid('char_');
    $email = strtolower(trim($input['email'] ?? 'guest'));
    $charName = trim($input['charName'] ?? 'Custom Husser');
    $limbsJson = json_encode($input['limbs'] ?? []);

    $stmt =$pdo->prepare("INSERT OR REPLACE INTO characters (id, owner_email, char_name, limbs_json, updated_at) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id,$email, $charName,$limbsJson, time()]);
    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

if ($action === 'list_characters') {
    $email = strtolower(trim($_GET['email'] ?? 'guest'));
    $stmt =$pdo->prepare("SELECT * FROM characters WHERE owner_email = ? OR owner_email = 'guest' ORDER BY updated_at DESC");
    $stmt->execute([$email]);
    $rows =$stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['limbs'] = json_decode($r['limbs_json'], true);
        unset($r['limbs_json']);
    }
    echo json_encode(['ok' => true, 'characters' => $rows]);
    exit;
}

if ($action === 'delete_character') {
    $id =$input['id'] ?? '';
    $stmt =$pdo->prepare("DELETE FROM characters WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'post_score') {
    $email = strtolower(trim($input['email'] ?? 'guest@local'));
    $name = trim($input['name'] ?? 'Guest Runner');
    $speed = (int)($input['speed'] ?? 0);
    $distance = (int)($input['distance'] ?? 0);
    $score = (int)($input['score'] ?? 0);

    $stmt =$pdo->prepare("INSERT INTO leaderboard (email, name, speed, distance, score, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$email, $name,$speed, $distance,$score, time()]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'leaderboard') {
    $stmt =$pdo->query("SELECT name, email, MAX(speed) as speed, MAX(distance) as distance, MAX(score) as score FROM leaderboard GROUP BY email, name ORDER BY score DESC LIMIT 25");
    $rows =$stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['ok' => true, 'leaderboard' => $rows]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Unknown action']);