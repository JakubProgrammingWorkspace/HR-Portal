<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY)]
class ValidEmployeeReference extends Constraint
{
    public string $message = 'Pracownik o podanym identyfikatorze nie istnieje.';
}
