<?php
// Simple JSON storage endpoint
// Writes payload to ../assets/portfolio/items.json
// Protect via Basic Auth (same credentials as admin UI)

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Require HTTPS in production
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'on') {
  // Allow over HTTP for local dev; comment out next two lines to force HTTPS
  // http_response_code(400);
  // echo json_encode(['ok' => false, 'error' => 'HTTPS required']); exit;
}

// Auth
$validUser = 'Adam.FS.314257';
$validPass = '314257Eqrwtu';

if (!isset($_SERVER['PHP_AUTH_USER'])) {
  header('WWW-Authenticate: Basic realm="Protected"');
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
  exit;
}

if (!hash_equals($validUser, $_SERVER['PHP_AUTH_USER']) || !hash_equals($validPass, $_SERVER['PHP_AUTH_PW'])) {
  http_response_code(403);
  echo json_encode(['ok' => false, 'error' => 'Forbidden']);
  exit;
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Allow: POST');
  echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
  exit;
}

// Validate items structure: array of objects with src (string)
foreach ($data as $item) {
  if (!is_array($item) || !isset($item['src']) || !is_string($item['src'])) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Invalid item structure']);
    exit;
  }
}

$target = __DIR__ . '/../assets/portfolio/items.json';
$dir = dirname($target);
if (!is_dir($dir)) {
  if (!mkdir($dir, 0775, true)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to create directory']);
    exit;
  }
}

$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($json === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Encoding error']);
  exit;
}

$tmp = $target . '.tmp';
if (file_put_contents($tmp, $json) === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Write error']);
  exit;
}
if (!rename($tmp, $target)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Atomic write error']);
  exit;
}

echo json_encode(['ok' => true]);
?>

