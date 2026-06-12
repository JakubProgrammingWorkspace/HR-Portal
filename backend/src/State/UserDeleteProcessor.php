<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use App\Service\UserService;

/**
 * @implements ProcessorInterface<User, void>
 */
class UserDeleteProcessor implements ProcessorInterface
{
    public function __construct(private readonly UserService $userService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $this->userService->deleteUser($data);
    }
}
