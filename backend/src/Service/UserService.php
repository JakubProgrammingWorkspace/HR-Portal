<?php

namespace App\Service;

use App\Dto\UserCreateInput;
use App\Dto\UserUpdateInput;
use App\Entity\User;
use App\Repository\RoleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly RoleRepository $roleRepository,
        private readonly Security $security,
    ) {
    }

    public function createUser(UserCreateInput $input): User
    {
        $user = new User();
        $user->setEmail($input->email);
        $user->setFirstName($input->firstName);
        $user->setLastName($input->lastName);
        $user->setPassword($this->passwordHasher->hashPassword($user, $input->password));
        $this->assignRoles($user, $input->roles);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function updateUser(User $user, UserUpdateInput $input): User
    {
        if (null !== $input->firstName) {
            $user->setFirstName($input->firstName);
        }

        if (null !== $input->lastName) {
            $user->setLastName($input->lastName);
        }

        if (null !== $input->isActive) {
            if (false === $input->isActive && $this->isCurrentUser($user)) {
                throw new ConflictHttpException('Nie można deaktywować własnego konta.');
            }
            $user->setIsActive($input->isActive);
        }

        if (null !== $input->roles) {
            $this->assignRoles($user, $input->roles);
        }

        $this->entityManager->flush();

        return $user;
    }

    public function deleteUser(User $user): void
    {
        if ($this->isCurrentUser($user)) {
            throw new ConflictHttpException('Nie można usunąć własnego konta.');
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }

    private function isCurrentUser(User $user): bool
    {
        $currentUser = $this->security->getUser();

        return $currentUser instanceof User && $currentUser->getId() === $user->getId();
    }

    /**
     * @param list<string> $roleCodes
     */
    private function assignRoles(User $user, array $roleCodes): void
    {
        foreach ($user->getRoleEntities()->toArray() as $role) {
            $user->removeRoleEntity($role);
        }

        if ([] === $roleCodes) {
            return;
        }

        foreach ($this->roleRepository->findBy(['code' => $roleCodes]) as $role) {
            $user->addRoleEntity($role);
        }
    }
}
