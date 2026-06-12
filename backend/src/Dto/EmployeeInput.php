<?php

namespace App\Dto;

use App\Validator\ValidCompanyReference;
use Symfony\Component\Validator\Constraints as Assert;

class EmployeeInput
{
    #[Assert\NotBlank]
    public string $firstName = '';

    #[Assert\NotBlank]
    public string $lastName = '';

    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^\d{11}$/', message: 'PESEL musi składać się z 11 cyfr.')]
    public string $pesel = '';

    #[Assert\NotBlank]
    public string $phone = '';

    #[Assert\NotBlank]
    #[Assert\Email(message: 'Adres e-mail jest nieprawidłowy.')]
    public string $email = '';

    #[Assert\NotBlank]
    public string $address = '';

    #[Assert\NotBlank]
    #[ValidCompanyReference]
    public string $company = '';
}
