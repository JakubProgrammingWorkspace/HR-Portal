<?php

// Placeholder front controller until the Symfony 6 + API Platform skeleton
// is scaffolded in US-002. Keeps nginx/php-fpm serving a 200 response so
// the Docker Compose stack can be verified end-to-end.

header('Content-Type: application/json');
echo json_encode(['status' => 'ok', 'message' => 'HR-Portal backend skeleton pending (US-002)']);
