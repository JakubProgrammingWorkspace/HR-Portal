<?php

namespace App\Enum;

enum ExaminationType: string
{
    case Wstepne = 'wstepne';
    case Okresowe = 'okresowe';
    case Kontrolne = 'kontrolne';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Wstepne => 'wstępne',
            self::Okresowe => 'okresowe',
            self::Kontrolne => 'kontrolne',
        };
    }
}
