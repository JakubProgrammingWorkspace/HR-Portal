<?php

namespace App\Controller;

use Symfony\Component\Routing\Attribute\Route;

class SecurityController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): never
    {
        throw new \LogicException('This route is handled by the json_login authenticator and should never be reached directly.');
    }
}
