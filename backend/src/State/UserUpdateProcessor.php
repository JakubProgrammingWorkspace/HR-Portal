<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\UserUpdateInput;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProcessorInterface<UserUpdateInput, User>
 */
class UserUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly UserService $userService,
        private readonly UserRepository $userRepository,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        $user = $this->userRepository->find($uriVariables['id']);

        if (!$user instanceof User) {
            throw new NotFoundHttpException('Użytkownik nie został znaleziony.');
        }

        return $this->userService->updateUser($user, $data);
    }
}
