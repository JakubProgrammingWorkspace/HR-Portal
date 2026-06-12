<?php

namespace App\Dto;

class UserUpdateInput
{
    public ?string $firstName = null;

    public ?string $lastName = null;

    public ?bool $isActive = null;

    /**
     * @var list<string>|null
     */
    public ?array $roles = null;
}
