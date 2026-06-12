<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\UserCreateInput;
use App\Entity\User;
use App\Service\UserService;

/**
 * @implements ProcessorInterface<UserCreateInput, User>
 */
class UserCreateProcessor implements ProcessorInterface
{
    public function __construct(private readonly UserService $userService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        return $this->userService->createUser($data);
    }
}
