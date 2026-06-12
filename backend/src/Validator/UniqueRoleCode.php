<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY)]
class UniqueRoleCode extends Constraint
{
    public string $message = 'Rola o kodzie "{{ code }}" już istnieje.';
}
