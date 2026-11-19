<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Referral;
use App\Service\ReferralService;

/**
 * @implements ProcessorInterface<Referral, Referral>
 */
class ReferralGeneratePdfProcessor implements ProcessorInterface
{
    public function __construct(private readonly ReferralService $referralService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Referral
    {
        return $this->referralService->generatePdf($data);
    }
}
