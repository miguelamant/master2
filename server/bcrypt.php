<?php

$p = "password123";
echo password_hash($p, PASSWORD_BCRYPT, ['cost' => 10]) . PHP_EOL;
