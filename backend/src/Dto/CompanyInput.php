<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class CompanyInput
{
    #[Assert\NotBlank]
    public string $name = '';

    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^\d{10}$/', message: 'NIP musi składać się z 10 cyfr.')]
    public string $nip = '';

    #[Assert\NotBlank]
    public string $street = '';

    #[Assert\NotBlank]
    public string $city = '';

    #[Assert\NotBlank]
    public string $postalCode = '';
}
