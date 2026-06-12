<?php

namespace App\Dto;

use App\Enum\ExaminationType;
use App\Validator\ValidEmployeeReference;
use Symfony\Component\Validator\Constraints as Assert;

class ReferralInput
{
    #[Assert\NotBlank]
    #[ValidEmployeeReference]
    public string $employee = '';

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ExaminationType::class, 'values'], message: 'Typ badania musi być jednym z: wstępne, okresowe, kontrolne.')]
    public string $examinationType = '';

    #[Assert\NotBlank]
    public string $jobPosition = '';

    #[Assert\NotBlank]
    public string $jobDescription = '';

    #[Assert\NotBlank]
    public string $issuePlace = '';

    #[Assert\NotBlank]
    #[Assert\Date(message: 'Data wystawienia musi być prawidłową datą (RRRR-MM-DD).')]
    public string $issueDate = '';

    /**
     * @var list<array{factor?: string, exposureDetails?: string}>
     */
    public array $exposureFactors = [];
}
