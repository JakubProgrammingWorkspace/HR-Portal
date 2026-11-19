<?php

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Restricts /api/users and /api/roles operations (wired via security.yaml
 * access_control) to users with ROLE_ADMIN.
 *
 * @extends Voter<string, mixed>
 */
class UserManagementVoter extends Voter
{
    public const MANAGE_USERS = 'MANAGE_USERS';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::MANAGE_USERS === $attribute;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        return $user instanceof User && \in_array('ROLE_ADMIN', $user->getRoles(), true);
    }
}
