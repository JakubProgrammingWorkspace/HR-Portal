<?php

namespace App\Enum;

enum ExaminationType: string
{
    case Wstepne = 'wstepne';
    case Okresowe = 'okresowe';
    case Kontrolne = 'kontrolne';
}
