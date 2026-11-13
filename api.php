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
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            password_hash TEXT,
            picture TEXT DEFAULT '',
            state_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            owner_email TEXT NOT NULL,
            owner_name TEXT DEFAULT 'Husser',
            char_name TEXT NOT NULL,
            limbs_json TEXT NOT NULL,
            is_public INTEGER DEFAULT 1,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            picture TEXT DEFAULT '',
            speed INTEGER NOT NULL,
            distance INTEGER NOT NULL,
            score INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
    ");
    try { $pdo->exec("ALTER TABLE users ADD COLUMN picture TEXT DEFAULT ''"); } catch (Exception $ignore) {}
    try { $pdo->exec("ALTER TABLE leaderboard ADD COLUMN picture TEXT DEFAULT ''"); } catch (Exception $ignore) {}
    try { $pdo->exec("ALTER TABLE characters ADD COLUMN owner_name TEXT DEFAULT 'Husser'"); } catch (Exception $ignore) {}
    try { $pdo->exec("ALTER TABLE characters ADD COLUMN is_public INTEGER DEFAULT 1"); } catch (Exception $ignore) {}
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Database init failed: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($action === 'register') {
    $email = strtolower(trim($input['email'] ?? ''));
    $name = trim($input['name'] ?? 'Sprinter');
    $passHash = $input['passwordHash'] ?? '';
    $picture = trim($input['picture'] ?? '');
    $stateJson = json_encode($input['state'] ?? []);

    $stmt = $pdo->prepare("SELECT email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['ok' => false, 'error' => 'Email already registered. Please Login instead.']);
        exit;
    }

    $ins = $pdo->prepare("INSERT INTO users (email, name, password_hash, picture, state_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
    $ins->execute([$email, $name, $passHash, $picture, $stateJson, time()]);
    echo json_encode(['ok' => true, 'user' => ['email' => $email, 'name' => $name, 'picture' => $picture], 'state' => json_decode($stateJson, true)]);
    exit;
}

if ($action === 'login') {
    $email = strtolower(trim($input['email'] ?? ''));
    $passHash = $input['passwordHash'] ?? '';
    $isOAuth = !empty($input['isOAuth']);
    $picture = trim($input['picture'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        if ($isOAuth) {
            $name = trim($input['name'] ?? 'Google Runner');
            $stateJson = json_encode($input['state'] ?? []);
            $ins = $pdo->prepare("INSERT INTO users (email, name, password_hash, picture, state_json, updated_at) VALUES (?, ?, '', ?, ?, ?)");
            $ins->execute([$email, $name, $picture, $stateJson, time()]);
            echo json_encode(['ok' => true, 'user' => ['email' => $email, 'name' => $name, 'picture' => $picture], 'state' => json_decode($stateJson, true)]);
            exit;
        }
        echo json_encode(['ok' => false, 'error' => 'Account not found. Please Sign Up first.']);
        exit;
    }

    if (!$isOAuth && $row['password_hash'] !== $passHash) {
        echo json_encode(['ok' => false, 'error' => 'Incorrect password for this account.']);
        exit;
    }

    $finalPic = $picture !== '' ? $picture : ($row['picture'] ?? '');
    if ($picture !== '' && $picture !== ($row['picture'] ?? '')) {
        $updPic = $pdo->prepare("UPDATE users SET picture = ?, updated_at = ? WHERE email = ?");
        $updPic->execute([$finalPic, time(), $email]);
    }

    echo json_encode([
        'ok' => true,
        'user' => ['email' => $row['email'], 'name' => $row['name'], 'picture' => $finalPic],
        'state' => json_decode($row['state_json'], true)
    ]);
    exit;
}

if ($action === 'sync_state') {
    $email = strtolower(trim($input['email'] ?? ''));
    $stateJson = json_encode($input['state'] ?? []);
    $upd = $pdo->prepare("UPDATE users SET state_json = ?, updated_at = ? WHERE email = ?");
    $upd->execute([$stateJson, time(), $email]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'get_state') {
    $email = strtolower(trim($_GET['email'] ?? ''));
    $stmt = $pdo->prepare("SELECT email, name, picture, state_json FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo json_encode([
            'ok' => true,
            'user' => ['email' => $row['email'], 'name' => $row['name'], 'picture' => $row['picture'] ?? ''],
            'state' => json_decode($row['state_json'], true)
        ]);
        exit;
    }
    echo json_encode(['ok' => false]);
    exit;
}

if ($action === 'update_nickname') {
    $email = strtolower(trim($input['email'] ?? ''));
    $rawName = trim($input['name'] ?? '');
    $cleanName = trim(preg_replace('/\s*\([^)]*@[^)]*\)\s*$/', '', $rawName));
    if ($email === '' || $cleanName === '') {
        echo json_encode(['ok' => false, 'error' => 'Invalid nickname.']);
        exit;
    }
    $updUser = $pdo->prepare("UPDATE users SET name = ?, updated_at = ? WHERE email = ?");
    $updUser->execute([$cleanName, time(), $email]);

    $updLb = $pdo->prepare("UPDATE leaderboard SET name = ? WHERE email = ?");
    $updLb->execute([$cleanName, $email]);

    $updChar = $pdo->prepare("UPDATE characters SET owner_name = ? WHERE owner_email = ?");
    $updChar->execute([$cleanName, $email]);

    echo json_encode(['ok' => true, 'name' => $cleanName]);
    exit;
}

if ($action === 'list_music' || $action === 'list_menu_music') {
    $folder = $action === 'list_menu_music' ? 'menu_music' : 'music';
    $musicDir = __DIR__ . '/' . $folder;
    $tracks = [];
    if (is_dir($musicDir)) {
        $files = scandir($musicDir);
        foreach ($files as $f) {
            if (preg_match('/\.(mp3|ogg|wav|m4a|webm)$/i', $f)) {
                $tracks[] = $folder . '/' . $f;
            }
        }
    }
    echo json_encode(['ok' => true, 'tracks' => $tracks]);
    exit;
}

if ($action === 'save_character') {
    $id = $input['id'] ?? uniqid('char_');
    $email = strtolower(trim($input['email'] ?? 'guest'));
    $ownerName = trim($input['ownerName'] ?? 'Husser');
    $charName = trim($input['charName'] ?? 'Custom Husser');
    $limbsJson = json_encode($input['limbs'] ?? []);
    $isPublic = isset($input['isPublic']) ? (int)(bool)$input['isPublic'] : 0;

    // Keep unauthenticated Guest characters in the player's local browser IndexedDB until they sign in
    if ($email === '' || $email === 'guest' || $email === 'guest@local') {
        echo json_encode(['ok' => true, 'id' => $id, 'is_public' => $isPublic, 'local_only' => true]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT OR REPLACE INTO characters (id, owner_email, owner_name, char_name, limbs_json, is_public, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $email, $ownerName, $charName, $limbsJson, $isPublic, time()]);
    echo json_encode(['ok' => true, 'id' => $id, 'is_public' => $isPublic]);
    exit;
}

if ($action === 'toggle_character_public') {
    $id = $input['id'] ?? '';
    $isPublic = !empty($input['isPublic']) ? 1 : 0;
    $stmt = $pdo->prepare("UPDATE characters SET is_public = ?, updated_at = ? WHERE id = ?");
    $stmt->execute([$isPublic, time(), $id]);
    echo json_encode(['ok' => true, 'id' => $id, 'is_public' => $isPublic]);
    exit;
}

if ($action === 'list_characters') {
    // Reassign 'triple t' from Guest Husser to Unsei sod's registered account
    $pdo->exec("
        UPDATE characters
        SET owner_email = (SELECT email FROM users WHERE LOWER(name) = 'unsei sod' LIMIT 1),
            owner_name = (SELECT name FROM users WHERE LOWER(name) = 'unsei sod' LIMIT 1)
        WHERE owner_email = 'guest'
          AND LOWER(char_name) = 'triple t'
          AND EXISTS (SELECT 1 FROM users WHERE LOWER(name) = 'unsei sod')
    ");

    $email = strtolower(trim($_GET['email'] ?? 'guest'));
    if ($email === '' || $email === 'guest' || $email === 'guest@local') {
        echo json_encode(['ok' => false, 'local_only' => true]);
        exit;
    }

    // Strict owner_email = ? check so other people's guest characters never leak into your Vault or Showcase!
    $stmt = $pdo->prepare("SELECT id, owner_email, owner_name, char_name, limbs_json, is_public, updated_at FROM characters WHERE owner_email = ? ORDER BY updated_at DESC");
    $stmt->execute([$email]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['limbs'] = json_decode($r['limbs_json'], true);
        unset($r['limbs_json']);
        unset($r['owner_email']);
    }
    echo json_encode(['ok' => true, 'characters' => $rows]);
    exit;
}

if ($action === 'list_public_ugc') {
    $stmt = $pdo->query("SELECT id, owner_name, char_name, limbs_json, updated_at FROM characters WHERE is_public = 1 ORDER BY updated_at DESC LIMIT 24");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['limbs'] = json_decode($r['limbs_json'], true);
        unset($r['limbs_json']);
    }
    echo json_encode(['ok' => true, 'characters' => $rows]);
    exit;
}

if ($action === 'get_public_profile') {
    $name = trim($_GET['name'] ?? '');
    $stmt = $pdo->prepare("SELECT email, name, picture, state_json FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1");
    $stmt->execute([$name]);
    $userRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($userRow) {
        $state = json_decode($userRow['state_json'], true) ?? [];
        $cStmt = $pdo->prepare("SELECT id, owner_name, char_name, limbs_json, updated_at FROM characters WHERE owner_email = ? AND is_public = 1 ORDER BY updated_at DESC LIMIT 12");
        $cStmt->execute([$userRow['email']]);
        $chars = $cStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($chars as &$c) {
            $c['limbs'] = json_decode($c['limbs_json'], true);
            unset($c['limbs_json']);
        }
        echo json_encode([
            'ok' => true,
            'profile' => [
                'name' => $userRow['name'],
                'picture' => $userRow['picture'] ?? '',
                'bestScore' => (int)($state['bestScore'] ?? 0),
                'bestSpeed' => (int)($state['bestSpeed'] ?? 0),
                'bestDistance' => (int)($state['bestDistance'] ?? 0),
                'scrap' => (int)($state['scrap'] ?? 0),
                'upgrades' => $state['upgrades'] ?? ['engine' => 1, 'fuel' => 1, 'traction' => 1],
                'clearedRivalsCount' => count($state['clearedRivals'] ?? []),
                'limbs' => $state['limbs'] ?? null,
                'characters' => $chars
            ]
        ]);
        exit;
    }

    // Fallback to leaderboard stats if guest/unregistered
    $lbStmt = $pdo->prepare("SELECT name, MAX(picture) as picture, MAX(speed) as speed, MAX(distance) as distance, MAX(score) as score FROM leaderboard WHERE LOWER(name) = LOWER(?) GROUP BY name LIMIT 1");
    $lbStmt->execute([$name]);
    $lbRow = $lbStmt->fetch(PDO::FETCH_ASSOC);
    if ($lbRow) {
        echo json_encode([
            'ok' => true,
            'profile' => [
                'name' => $lbRow['name'],
                'picture' => $lbRow['picture'] ?? '',
                'bestScore' => (int)$lbRow['score'],
                'bestSpeed' => (int)$lbRow['speed'],
                'bestDistance' => (int)$lbRow['distance'],
                'scrap' => 0,
                'upgrades' => ['engine' => 1, 'fuel' => 1, 'traction' => 1],
                'clearedRivalsCount' => 0,
                'limbs' => null,
                'characters' => []
            ]
        ]);
        exit;
    }

    echo json_encode(['ok' => false, 'error' => 'Profile not found.']);
    exit;
}

if ($action === 'delete_character') {
    $id = $input['id'] ?? '';
    $stmt = $pdo->prepare("DELETE FROM characters WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'post_score') {
    $email = strtolower(trim($input['email'] ?? ''));
    $rawName = trim($input['name'] ?? '');
    $name = trim(preg_replace('/\s*\([^)]*@[^)]*\)\s*$/', '', $rawName));

    // Block unauthenticated / Guest Husser runs from being posted to the leaderboard
    if ($email === '' || $email === 'guest@local' || $email === 'guest' || strtolower($name) === 'guest husser' || strtolower($name) === 'guest runner') {
        echo json_encode(['ok' => true, 'skipped_guest' => true]);
        exit;
    }

    $picture = trim($input['picture'] ?? '');
    $speed = (int)($input['speed'] ?? 0);
    $distance = (int)($input['distance'] ?? 0);
    $score = (int)($input['score'] ?? 0);

    $stmt = $pdo->prepare("INSERT INTO leaderboard (email, name, picture, speed, distance, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$email, $name, $picture, $speed, $distance, $score, time()]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'leaderboard') {
    // Purge any old guest records and only return registered accounts
    $pdo->exec("DELETE FROM leaderboard WHERE email IN ('guest@local', 'guest', '') OR LOWER(name) IN ('guest husser', 'guest runner')");
    $stmt = $pdo->query("SELECT name, MAX(picture) as picture, MAX(speed) as speed, MAX(distance) as distance, MAX(score) as score FROM leaderboard WHERE email NOT IN ('guest@local', 'guest', '') AND LOWER(name) NOT IN ('guest husser', 'guest runner') GROUP BY email ORDER BY score DESC LIMIT 25");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['ok' => true, 'leaderboard' => $rows]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Unknown action']);