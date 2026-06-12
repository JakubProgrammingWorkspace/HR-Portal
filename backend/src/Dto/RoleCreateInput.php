<?php

namespace App\Dto;

use App\Validator\UniqueRoleCode;
use Symfony\Component\Validator\Constraints as Assert;

class RoleCreateInput
{
    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^ROLE_[A-Z0-9_]+$/', message: 'Kod roli musi być zgodny ze wzorcem ROLE_*, np. ROLE_MANAGER.')]
    #[UniqueRoleCode]
    public string $code = '';

    #[Assert\NotBlank]
    public string $name = '';

    public ?string $description = null;
}
