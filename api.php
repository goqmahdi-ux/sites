<?php
/*
 * 1st ISC 2026 — منصة العروض العلمية (العروش للفعاليات)
 * API واحد بدون قاعدة بيانات: البيانات تنحفظ بملف JSON برا مجلد الموقع.
 */
declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Baghdad');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-LiteSpeed-Cache-Control: no-cache');
header('X-Content-Type-Options: nosniff');

const DEFAULT_PASS = 'uroosh2026';
const MAX_UPLOAD = 60 * 1024 * 1024;

function out(int $code, array $body): void { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }

function data_dir(): string {
    static $dir = null;
    if ($dir) return $dir;
    $cands = [dirname(__DIR__, 2) . '/.uroosh-data-isc', __DIR__ . '/_data'];
    foreach ($cands as $d) {
        if ((is_dir($d) || @mkdir($d, 0700, true)) && is_writable($d)) {
            if (strpos($d, __DIR__) === 0) {
                if (!file_exists("$d/.htaccess")) @file_put_contents("$d/.htaccess", "Require all denied\nDeny from all\n");
                if (!file_exists("$d/index.html")) @file_put_contents("$d/index.html", '');
            }
            return $dir = $d;
        }
    }
    out(500, ['error' => 'storage', 'msg' => 'السيرفر ما يسمح نحفظ البيانات']);
}
function f_data(): string { return data_dir() . '/data.json'; }
function fresh(): array {
    return ['talks' => new stdClass(), 'settings' => ['dur' => 15, 'showTime' => true],
        'pass' => null, 'sessions' => [], 'live' => null, 'cmd' => ['n' => 0], 'fails' => []];
}
function load(): array {
    $b = fresh();
    $raw = @file_get_contents(f_data());
    if ($raw === false || $raw === '') return $b;
    $s = json_decode($raw, true);
    if (!is_array($s)) { @copy(f_data(), f_data() . '.broken-' . time()); return $b; }
    $s = array_merge($b, $s);
    if (!is_array($s['talks']) || !$s['talks']) $s['talks'] = new stdClass();
    if (!is_array($s['sessions'])) $s['sessions'] = [];
    if (!is_array($s['fails'])) $s['fails'] = [];
    $s['settings'] = array_merge($b['settings'], (array)$s['settings']);
    return $s;
}
function save(array $S): void {
    $tmp = f_data() . '.tmp' . getmypid();
    file_put_contents($tmp, json_encode($S, JSON_UNESCAPED_UNICODE));
    rename($tmp, f_data());
    $bk = data_dir() . '/backups';
    if (!is_dir($bk)) @mkdir($bk, 0700, true);
    $name = $bk . '/data-' . date('Ymd-H') . '.json';
    if (!file_exists($name)) {
        @copy(f_data(), $name);
        $all = glob($bk . '/data-*.json') ?: [];
        sort($all);
        while (count($all) > 96) @unlink(array_shift($all));
    }
}
/* run a read-modify-write under an exclusive lock */
function tx(callable $fn) {
    $lock = fopen(data_dir() . '/lock', 'c');
    flock($lock, LOCK_EX);
    $S = load();
    $r = $fn($S);
    save($S);
    flock($lock, LOCK_UN);
    fclose($lock);
    return $r;
}
function body(): array {
    if (!empty($_POST)) return $_POST;
    $j = json_decode((string)file_get_contents('php://input'), true);
    return is_array($j) ? $j : [];
}
function clean_str($v, int $max = 600): string { return mb_substr(trim((string)$v), 0, $max); }
function ip(): string { return (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''); }
function authed(array $S, $tok): bool {
    $tok = (string)$tok;
    if ($tok === '' || !isset($S['sessions'][$tok])) return false;
    return ($S['sessions'][$tok] ?? 0) > time();
}
function need_auth(array $S, array $B): void { if (!authed($S, $B['token'] ?? '')) out(401, ['error' => 'auth', 'msg' => 'سجل دخول مرة ثانية']); }
function pass_ok(array $S, string $p): bool {
    if ($S['pass']) return password_verify($p, $S['pass']);
    return hash_equals(DEFAULT_PASS, $p);
}
function sanitize_talk(array $p): array {
    $o = [];
    foreach (['ar' => 120, 'who' => 160, 't' => 600, 'sp' => 300] as $k => $m) if (array_key_exists($k, $p)) $o[$k] = clean_str($p[$k], $m);
    if (array_key_exists('al', $p)) $o['al'] = array_values(array_slice(array_map(fn($x) => clean_str($x, 80), array_filter((array)$p['al'], 'is_string')), 0, 12));
    if (array_key_exists('dur', $p)) $o['dur'] = ($p['dur'] === null || $p['dur'] === '') ? null : max(0.05, min(120, (float)$p['dur']));
    foreach (['hidden', 'done', 'custom', 'deleted'] as $k) if (array_key_exists($k, $p)) $o[$k] = (bool)$p[$k];
    if (array_key_exists('order', $p)) $o['order'] = (float)$p['order'];
    if (array_key_exists('doneAt', $p)) $o['doneAt'] = (int)$p['doneAt'];
    if (array_key_exists('file', $p)) {
        $f = $p['file'];
        if ($f === null) $o['file'] = null;
        elseif (is_array($f)) {
            $kind = ($f['kind'] ?? '') === 'img' ? 'img' : 'pdf';
            $okUrl = fn($u) => is_string($u) && preg_match('#^uploads/[A-Za-z0-9._-]+$#', $u);
            $o['file'] = ['kind' => $kind, 'name' => clean_str($f['name'] ?? '', 160), 'pages' => (int)($f['pages'] ?? 0),
                'url' => $okUrl($f['url'] ?? '') ? $f['url'] : null,
                'thumb' => $okUrl($f['thumb'] ?? '') ? $f['thumb'] : null,
                'urls' => array_values(array_filter((array)($f['urls'] ?? []), $okUrl))];
        }
    }
    return $o;
}

$a = (string)($_GET['a'] ?? '');
$B = $_SERVER['REQUEST_METHOD'] === 'POST' ? body() : [];

switch ($a) {
case 'state': {
    $S = load();
    $admin = authed($S, $_GET['token'] ?? '');
    out(200, ['talks' => $S['talks'], 'settings' => $S['settings'], 'live' => $S['live'], 'cmd' => $S['cmd'], 'admin' => $admin, 'now' => (int)round(microtime(true) * 1000)]);
}
case 'login': {
    $p = (string)($B['pass'] ?? '');
    $r = tx(function (&$S) use ($p) {
        $now = time();
        $S['fails'] = array_values(array_filter($S['fails'], fn($t) => $t > $now - 600));
        if (count($S['fails']) >= 12) return ['err' => 'محاولات كثيرة، انتظر 10 دقائق'];
        if (!pass_ok($S, $p)) { $S['fails'][] = $now; return ['err' => 'كلمة السر غلط']; }
        foreach ($S['sessions'] as $k => $exp) if ($exp < $now) unset($S['sessions'][$k]);
        $tok = bin2hex(random_bytes(24));
        $S['sessions'][$tok] = $now + 14 * 86400;
        return ['token' => $tok];
    });
    if (isset($r['err'])) out(403, ['error' => 'login', 'msg' => $r['err']]);
    out(200, $r);
}
case 'talk': {
    $S = load(); need_auth($S, $B);
    $id = (string)($B['id'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]{1,40}$/', $id)) out(400, ['error' => 'id']);
    $patch = sanitize_talk((array)($B['patch'] ?? []));
    $t = tx(function (&$S) use ($id, $patch) {
        $talks = (array)$S['talks'];
        $talks[$id] = array_merge((array)($talks[$id] ?? []), $patch);
        $S['talks'] = $talks;
        return $talks[$id];
    });
    out(200, ['ok' => true, 'talk' => $t]);
}
case 'settings': {
    $S = load(); need_auth($S, $B);
    tx(function (&$S) use ($B) {
        if (isset($B['dur'])) $S['settings']['dur'] = max(0.05, min(120, (float)$B['dur']));
        if (isset($B['showTime'])) $S['settings']['showTime'] = (bool)$B['showTime'];
        $np = (string)($B['newPass'] ?? '');
        if ($np !== '') {
            if (mb_strlen($np) < 6) return;
            $S['pass'] = password_hash($np, PASSWORD_DEFAULT);
            $S['sessions'] = [(string)$B['token'] => time() + 14 * 86400];
        }
    });
    out(200, ['ok' => true, 'settings' => load()['settings']]);
}
case 'reset': {
    $S = load(); need_auth($S, $B);
    tx(function (&$S) { $t = (array)$S['talks']; foreach ($t as $k => $v) { $v = (array)$v; $v['done'] = false; $t[$k] = $v; } $S['talks'] = $t ?: new stdClass(); });
    out(200, ['ok' => true]);
}
case 'live': {
    // the presenting screen reports its state (no login needed on the stage laptop)
    $L = (array)($B['live'] ?? []);
    $live = ['talkId' => clean_str($L['talkId'] ?? '', 40), 'name' => clean_str($L['name'] ?? '', 120), 'title' => clean_str($L['title'] ?? '', 600),
        'total' => (float)($L['total'] ?? 0), 'elapsed' => (float)($L['elapsed'] ?? 0), 'running' => (bool)($L['running'] ?? false),
        'on' => (bool)($L['on'] ?? false), 'slide' => (int)($L['slide'] ?? 0), 'slides' => (int)($L['slides'] ?? 0), 'ended' => (bool)($L['ended'] ?? false),
        'at' => (int)round(microtime(true) * 1000)];
    $done = !empty($B['done']) ? $live['talkId'] : '';
    tx(function (&$S) use ($live, $done) {
        $S['live'] = $live;
        if ($done !== '' && preg_match('/^[A-Za-z0-9_-]{1,40}$/', $done)) {
            $t = (array)$S['talks']; $cur = (array)($t[$done] ?? []);
            $cur['done'] = true; $cur['doneAt'] = time() * 1000; $t[$done] = $cur; $S['talks'] = $t;
        }
    });
    out(200, ['ok' => true]);
}
case 'cmd': {
    $S = load(); need_auth($S, $B);
    $op = (string)($B['op'] ?? '');
    if (!in_array($op, ['pause', 'resume', 'plus', 'thanks', 'next', 'prev', 'stop'], true)) out(400, ['error' => 'op']);
    $cmd = ['op' => $op, 'talkId' => clean_str($B['talkId'] ?? '', 40), 'n' => (int)round(microtime(true) * 1000)];
    tx(function (&$S) use ($cmd) { $S['cmd'] = $cmd; });
    out(200, ['ok' => true, 'cmd' => $cmd]);
}
case 'upload': {
    $S = load(); need_auth($S, $_POST);
    $f = $_FILES['file'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) out(400, ['error' => 'upload', 'msg' => 'الملف ما وصل كامل' . (($f['error'] ?? 0) == UPLOAD_ERR_INI_SIZE ? ' — حجمه أكبر من المسموح بالسيرفر' : '')]);
    if ($f['size'] > MAX_UPLOAD) out(400, ['error' => 'size', 'msg' => 'الملف أكبر من 60 ميغا']);
    $head = (string)file_get_contents($f['tmp_name'], false, null, 0, 16);
    $ext = null;
    if (strncmp($head, '%PDF', 4) === 0) $ext = 'pdf';
    elseif (strncmp($head, "\xFF\xD8\xFF", 3) === 0) $ext = 'jpg';
    elseif (strncmp($head, "\x89PNG", 4) === 0) $ext = 'png';
    elseif (substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP') $ext = 'webp';
    if (!$ext) out(400, ['error' => 'type', 'msg' => 'لازم يكون PDF أو صورة']);
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    if (!file_exists("$dir/.htaccess")) @file_put_contents("$dir/.htaccess", "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh)$\">\nRequire all denied\n</FilesMatch>\n");
    $name = date('Ymd-His') . '-' . bin2hex(random_bytes(5)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) out(500, ['error' => 'move', 'msg' => 'ما انحفظ الملف بالسيرفر']);
    @chmod("$dir/$name", 0644);
    out(200, ['ok' => true, 'url' => 'uploads/' . $name, 'size' => (int)$f['size']]);
}
case 'ping': out(200, ['ok' => true, 'php' => PHP_VERSION, 'dir' => basename(data_dir()), 'upload_max' => ini_get('upload_max_filesize'), 'post_max' => ini_get('post_max_size')]);
default: out(404, ['error' => 'unknown']);
}
