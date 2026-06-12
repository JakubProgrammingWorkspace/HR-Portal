<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY)]
class ValidCompanyReference extends Constraint
{
    public string $message = 'Firma o podanym identyfikatorze nie istnieje.';
}
