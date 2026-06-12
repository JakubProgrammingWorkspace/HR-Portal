<?php

namespace App\Dto;

use App\Validator\ValidExposureCategoryReference;
use Symfony\Component\Validator\Constraints as Assert;

class ExposureFactorInput
{
    #[Assert\NotBlank]
    public string $name = '';

    #[Assert\NotBlank]
    #[ValidExposureCategoryReference]
    public string $category = '';

    public ?string $description = null;
}
