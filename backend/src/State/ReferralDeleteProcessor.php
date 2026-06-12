<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Referral;
use App\Service\ReferralService;

/**
 * @implements ProcessorInterface<Referral, void>
 */
class ReferralDeleteProcessor implements ProcessorInterface
{
    public function __construct(private readonly ReferralService $referralService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $this->referralService->deleteReferral($data);
    }
}
