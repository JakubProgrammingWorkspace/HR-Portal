<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY)]
class ValidExposureCategoryReference extends Constraint
{
    public string $message = 'Kategoria o podanym identyfikatorze nie istnieje.';
}
