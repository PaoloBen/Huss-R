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
    $pdo->exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");

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
        CREATE TABLE IF NOT EXISTS system_models (
            model_key TEXT PRIMARY KEY,
            limbs_json TEXT NOT NULL,
            trail_color TEXT DEFAULT '#38bdf8',
            updated_at INTEGER NOT NULL
        );
    ");
    try { $pdo->exec("ALTER TABLE users ADD COLUMN picture TEXT DEFAULT ''"); } catch (Exception $ignore) {}
    try { $pdo->exec("ALTER TABLE leaderboard ADD COLUMN picture TEXT DEFAULT ''"); } catch (Exception $ignore) {}
    try { $pdo->exec("ALTER TABLE characters ADD COLUMN owner_name TEXT DEFAULT 'Husser'"); } catch (Exception $ignore) {}
    try { $pdo->exec("ALTER TABLE characters ADD COLUMN is_public INTEGER DEFAULT 1"); } catch (Exception $ignore) {}
    try { $pdo->exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"); } catch (Exception $ignore) {}
    $pdo->exec("UPDATE users SET is_admin = 1 WHERE LOWER(name) = 'benndevs'");
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Database init failed: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

function isAdminAccount($pdo, $email) {
    $clean = strtolower(trim($email ?? ''));
    if ($clean === '' || $clean === 'guest' || $clean === 'guest@local') return false;
    $stmt = $pdo->prepare("SELECT name, is_admin FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$clean]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return false;
    return !empty($row['is_admin']) || strtolower(trim($row['name'])) === 'benndevs';
}

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

    $isAdmin = !empty($row['is_admin']) || strtolower(trim($row['name'])) === 'benndevs';
    echo json_encode([
        'ok' => true,
        'user' => ['email' => $row['email'], 'name' => $row['name'], 'picture' => $finalPic, 'is_admin' => $isAdmin],
        'state' => json_decode($row['state_json'], true)
    ]);
    exit;
}

if ($action === 'sync_state') {
    $email = strtolower(trim($input['email'] ?? ''));
    $stateArr = $input['state'] ?? [];

    // Never let an older/secondary device overwrite higher career progress already in the database
    $curStmt = $pdo->prepare("SELECT name, picture, state_json FROM users WHERE email = ?");
    $curStmt->execute([$email]);
    $curRow = $curStmt->fetch(PDO::FETCH_ASSOC);
    if ($curRow) {
        $dbState = json_decode($curRow['state_json'], true) ?? [];

        // If an Admin edited this account more recently than the client's last cloud pull, ignore stale client syncs
        $adminEditedAt = (int)($dbState['adminEditedAt'] ?? 0);
        $clientSyncAt  = (int)($stateArr['lastCloudSyncAt'] ?? 0);
        if ($adminEditedAt > 0 && $clientSyncAt < $adminEditedAt) {
            echo json_encode(['ok' => true, 'stale_rejected' => true]);
            exit;
        }

        $stateArr['bestScore']    = max((int)($stateArr['bestScore'] ?? 0),    (int)($dbState['bestScore'] ?? 0));
        $stateArr['bestSpeed']    = max((int)($stateArr['bestSpeed'] ?? 0),    (int)($dbState['bestSpeed'] ?? 0));
        $stateArr['bestDistance'] = max((int)($stateArr['bestDistance'] ?? 0), (int)($dbState['bestDistance'] ?? 0));

        $dbEng  = (int)($dbState['upgrades']['engine'] ?? 1);
        $dbFuel = (int)($dbState['upgrades']['fuel'] ?? 1);
        $dbTrac = (int)($dbState['upgrades']['traction'] ?? 1);

        $inEng  = (int)($stateArr['upgrades']['engine'] ?? 1);
        $inFuel = (int)($stateArr['upgrades']['fuel'] ?? 1);
        $inTrac = (int)($stateArr['upgrades']['traction'] ?? 1);

        if (!isset($stateArr['upgrades']) || !is_array($stateArr['upgrades'])) {
            $stateArr['upgrades'] = [];
        }
        $stateArr['upgrades']['engine']   = max($inEng, $dbEng);
        $stateArr['upgrades']['fuel']     = max($inFuel, $dbFuel);
        $stateArr['upgrades']['traction'] = max($inTrac, $dbTrac);

        $dbRivals = is_array($dbState['clearedRivals'] ?? null) ? $dbState['clearedRivals'] : [];
        $inRivals = is_array($stateArr['clearedRivals'] ?? null) ? $stateArr['clearedRivals'] : [];
        $stateArr['clearedRivals'] = array_values(array_unique(array_merge($dbRivals, $inRivals)));

        // Guard against stale secondary devices wiping out Nano-Scrap
        $dbScrap = (int)($dbState['scrap'] ?? 0);
        $inScrap = (int)($stateArr['scrap'] ?? 0);
        if (($inEng + $inFuel + $inTrac) < ($dbEng + $dbFuel + $dbTrac) && $inScrap < $dbScrap) {
            $stateArr['scrap'] = $dbScrap;
        }
        if ($adminEditedAt > 0) {
            $stateArr['adminEditedAt'] = $adminEditedAt;
        }
    }

    $stateJson = json_encode($stateArr);
    $upd = $pdo->prepare("UPDATE users SET state_json = ?, updated_at = ? WHERE email = ?");
    $upd->execute([$stateJson, time(), $email]);

    $bestScore = (int)($stateArr['bestScore'] ?? 0);
    $bestSpeed = (int)($stateArr['bestSpeed'] ?? 0);
    $bestDist  = (int)($stateArr['bestDistance'] ?? 0);
    if ($curRow && $email !== '' && $email !== 'guest' && $email !== 'guest@local' && ($bestScore > 0 || $bestSpeed > 0)) {
        $cleanName = trim(preg_replace('/\s*\([^)]*@[^)]*\)\s*$/', '', $curRow['name']));
        if ($cleanName !== '' && strtolower($cleanName) !== 'guest husser') {
            $lbIns = $pdo->prepare("INSERT INTO leaderboard (email, name, picture, speed, distance, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $lbIns->execute([$email, $cleanName, $curRow['picture'] ?? '', $bestSpeed, $bestDist, $bestScore, time()]);
        }
    }

    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'get_state') {
    $email = strtolower(trim($_GET['email'] ?? ''));
    $stmt = $pdo->prepare("SELECT email, name, picture, is_admin, state_json FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $isAdmin = !empty($row['is_admin']) || strtolower(trim($row['name'])) === 'benndevs';
        echo json_encode([
            'ok' => true,
            'user' => ['email' => $row['email'], 'name' => $row['name'], 'picture' => $row['picture'] ?? '', 'is_admin' => $isAdmin],
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

if ($action === 'get_system_models') {
    $stmt = $pdo->query("SELECT model_key, limbs_json, trail_color, updated_at FROM system_models");
    $models = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $models[$r['model_key']] = [
            'limbs' => json_decode($r['limbs_json'], true),
            'trailColor' => $r['trail_color'] ?? '#38bdf8',
            'updated_at' => (int)$r['updated_at']
        ];
    }
    echo json_encode(['ok' => true, 'models' => $models]);
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

    $uRows = $pdo->query("SELECT email, name, picture, state_json FROM users WHERE email NOT IN ('guest@local', 'guest', '')")->fetchAll(PDO::FETCH_ASSOC);
    $checkStmt = $pdo->prepare("SELECT MAX(score) as max_score, MAX(speed) as max_speed, MAX(distance) as max_dist FROM leaderboard WHERE email = ?");
    $insStmt = $pdo->prepare("INSERT INTO leaderboard (email, name, picture, speed, distance, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");

    foreach ($uRows as $u) {
        $st = json_decode($u['state_json'], true) ?? [];
        $bScore = (int)($st['bestScore'] ?? 0);
        $bSpeed = (int)($st['bestSpeed'] ?? 0);
        $bDist  = (int)($st['bestDistance'] ?? 0);
        if ($bScore <= 0 && $bSpeed <= 0) continue;

        $checkStmt->execute([$u['email']]);
        $cur = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$cur || $bScore > (int)$cur['max_score'] || $bSpeed > (int)$cur['max_speed'] || $bDist > (int)$cur['max_dist']) {
            $cleanName = trim(preg_replace('/\s*\([^)]*@[^)]*\)\s*$/', '', $u['name']));
            if ($cleanName !== '' && strtolower($cleanName) !== 'guest husser') {
                $insStmt->execute([
                    $u['email'],
                    $cleanName,
                    $u['picture'] ?? '',
                    max($bSpeed, (int)($cur['max_speed'] ?? 0)),
                    max($bDist, (int)($cur['max_dist'] ?? 0)),
                    max($bScore, (int)($cur['max_score'] ?? 0)),
                    time()
                ]);
            }
        }
    }

    $sortParam = strtolower(trim($_GET['sort'] ?? 'score'));
    $orderBy = 'score DESC, speed DESC';
    if ($sortParam === 'distance') {
        $orderBy = 'distance DESC, score DESC';
    } else if ($sortParam === 'speed') {
        $orderBy = 'speed DESC, score DESC';
    }

    $stmt = $pdo->query("SELECT name, MAX(picture) as picture, MAX(speed) as speed, MAX(distance) as distance, MAX(score) as score FROM leaderboard WHERE email NOT IN ('guest@local', 'guest', '') AND LOWER(name) NOT IN ('guest husser', 'guest runner') GROUP BY email ORDER BY $orderBy LIMIT 50");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['ok' => true, 'leaderboard' => $rows]);
    exit;
}

// ==========================================
// ADMIN-ONLY CONTROL PANEL ENDPOINTS
// ==========================================
if (strpos($action, 'admin_') === 0) {
    $adminEmail = strtolower(trim($input['adminEmail'] ?? ($_GET['adminEmail'] ?? '')));
    if (!isAdminAccount($pdo, $adminEmail)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Unauthorized: Admin privileges required.']);
        exit;
    }

    if ($action === 'admin_overview') {
        $uStmt = $pdo->query("SELECT email, name, picture, is_admin, state_json, updated_at FROM users ORDER BY updated_at DESC");
        $users = [];
        foreach ($uStmt->fetchAll(PDO::FETCH_ASSOC) as $u) {
            $st = json_decode($u['state_json'], true) ?? [];
            $users[] = [
                'email' => $u['email'],
                'name' => $u['name'],
                'picture' => $u['picture'] ?? '',
                'is_admin' => !empty($u['is_admin']) || strtolower(trim($u['name'])) === 'benndevs',
                'scrap' => (int)($st['scrap'] ?? 0),
                'bestScore' => (int)($st['bestScore'] ?? 0),
                'bestDistance' => (int)($st['bestDistance'] ?? 0),
                'bestSpeed' => (int)($st['bestSpeed'] ?? 0),
                'engine' => (int)($st['upgrades']['engine'] ?? 1),
                'fuel' => (int)($st['upgrades']['fuel'] ?? 1),
                'traction' => (int)($st['upgrades']['traction'] ?? 1),
                'clearedRivalsCount' => count($st['clearedRivals'] ?? []),
                'updated_at' => (int)$u['updated_at']
            ];
        }

        $cStmt = $pdo->query("SELECT id, owner_email, owner_name, char_name, limbs_json, is_public, updated_at FROM characters ORDER BY updated_at DESC");
        $chars = [];
        foreach ($cStmt->fetchAll(PDO::FETCH_ASSOC) as $c) {
            $limbs = json_decode($c['limbs_json'], true) ?? [];
            $chars[] = [
                'id' => $c['id'],
                'owner_email' => $c['owner_email'],
                'owner_name' => $c['owner_name'],
                'char_name' => $c['char_name'],
                'head' => $limbs['head'] ?? '',
                'is_public' => (int)$c['is_public'],
                'updated_at' => (int)$c['updated_at']
            ];
        }

        echo json_encode(['ok' => true, 'users' => $users, 'characters' => $chars]);
        exit;
    }

    if ($action === 'admin_update_user') {
        $targetEmail = strtolower(trim($input['targetEmail'] ?? ''));
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$targetEmail]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            echo json_encode(['ok' => false, 'error' => 'User not found.']);
            exit;
        }

        $st = json_decode($row['state_json'], true) ?? [];
        $newName = trim($input['name'] ?? $row['name']);
        $newAdmin = !empty($input['is_admin']) || strtolower($newName) === 'benndevs' ? 1 : 0;

        $st['scrap'] = max(0, (int)($input['scrap'] ?? ($st['scrap'] ?? 0)));
        $st['bestScore'] = max(0, (int)($input['bestScore'] ?? ($st['bestScore'] ?? 0)));
        $st['bestDistance'] = max(0, (int)($input['bestDistance'] ?? ($st['bestDistance'] ?? 0)));
        $st['bestSpeed'] = max(0, (int)($input['bestSpeed'] ?? ($st['bestSpeed'] ?? 0)));
        if (!isset($st['upgrades']) || !is_array($st['upgrades'])) {
            $st['upgrades'] = ['engine' => 1, 'fuel' => 1, 'traction' => 1];
        }
        $st['upgrades']['engine'] = max(1, (int)($input['engine'] ?? ($st['upgrades']['engine'] ?? 1)));
        $st['upgrades']['fuel'] = max(1, (int)($input['fuel'] ?? ($st['upgrades']['fuel'] ?? 1)));
        $st['upgrades']['traction'] = max(1, (int)($input['traction'] ?? ($st['upgrades']['traction'] ?? 1)));

        if (isset($input['clearedCount'])) {
            $cnt = max(0, min(20, (int)$input['clearedCount']));
            $rivals = [];
            for ($i = 1; $i <= $cnt; $i++) {
                $rivals[] = 'rival_' . $i;
            }
            $st['clearedRivals'] = $rivals;
        }
        $st['adminEditedAt'] = time();

        $upd = $pdo->prepare("UPDATE users SET name = ?, is_admin = ?, state_json = ?, updated_at = ? WHERE email = ?");
        $upd->execute([$newName, $newAdmin, json_encode($st), time(), $targetEmail]);

        // Replace leaderboard history for this user with the updated admin values so lowers/resets take effect too
        $delLb = $pdo->prepare("DELETE FROM leaderboard WHERE email = ?");
        $delLb->execute([$targetEmail]);
        if ($st['bestScore'] > 0 || $st['bestSpeed'] > 0 || $st['bestDistance'] > 0) {
            $insLb = $pdo->prepare("INSERT INTO leaderboard (email, name, picture, speed, distance, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $insLb->execute([$targetEmail, $newName, $row['picture'] ?? '', $st['bestSpeed'], $st['bestDistance'], $st['bestScore'], time()]);
        }

        $updChar = $pdo->prepare("UPDATE characters SET owner_name = ? WHERE owner_email = ?");
        $updChar->execute([$newName, $targetEmail]);

        echo json_encode(['ok' => true]);
        exit;
    }

    if ($action === 'admin_delete_user') {
        $targetEmail = strtolower(trim($input['targetEmail'] ?? ''));
        if ($targetEmail === $adminEmail) {
            echo json_encode(['ok' => false, 'error' => 'Cannot delete your own active admin account.']);
            exit;
        }
        $pdo->prepare("DELETE FROM users WHERE email = ?")->execute([$targetEmail]);
        $pdo->prepare("DELETE FROM leaderboard WHERE email = ?")->execute([$targetEmail]);
        $pdo->prepare("DELETE FROM characters WHERE owner_email = ?")->execute([$targetEmail]);
        echo json_encode(['ok' => true]);
        exit;
    }

    if ($action === 'admin_delete_character') {
        $id = $input['id'] ?? '';
        $pdo->prepare("DELETE FROM characters WHERE id = ?")->execute([$id]);
        echo json_encode(['ok' => true]);
        exit;
    }

    if ($action === 'admin_save_system_model') {
        $modelKey = trim($input['modelKey'] ?? '');
        $limbs = $input['limbs'] ?? [];
        $trailColor = trim($input['trailColor'] ?? '#38bdf8');
        if ($modelKey === '' || empty($limbs)) {
            echo json_encode(['ok' => false, 'error' => 'Invalid model key or limbs data.']);
            exit;
        }
        $stmt = $pdo->prepare("INSERT OR REPLACE INTO system_models (model_key, limbs_json, trail_color, updated_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$modelKey, json_encode($limbs), $trailColor, time()]);
        echo json_encode(['ok' => true, 'modelKey' => $modelKey]);
        exit;
    }

    if ($action === 'admin_reset_system_model') {
        $modelKey = trim($input['modelKey'] ?? '');
        $stmt = $pdo->prepare("DELETE FROM system_models WHERE model_key = ?");
        $stmt->execute([$modelKey]);
        echo json_encode(['ok' => true, 'modelKey' => $modelKey]);
        exit;
    }
}

echo json_encode(['ok' => false, 'error' => 'Unknown action']);