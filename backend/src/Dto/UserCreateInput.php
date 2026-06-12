<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class UserCreateInput
{
    #[Assert\NotBlank]
    #[Assert\Email]
    public string $email = '';

    #[Assert\NotBlank]
    public string $password = '';

    #[Assert\NotBlank]
    public string $firstName = '';

    #[Assert\NotBlank]
    public string $lastName = '';

    /**
     * @var list<string>
     */
    public array $roles = [];
}
