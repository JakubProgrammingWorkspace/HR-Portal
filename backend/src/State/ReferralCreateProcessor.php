<?php

namespace App\State;

use ApiPlatform\Metadata\IriConverterInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\ReferralInput;
use App\Entity\Employee;
use App\Entity\Referral;
use App\Entity\User;
use App\Service\ReferralService;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProcessorInterface<ReferralInput, Referral>
 */
class ReferralCreateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ReferralService $referralService,
        private readonly IriConverterInterface $iriConverter,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Referral
    {
        $employee = $this->iriConverter->getResourceFromIri($data->employee);
        \assert($employee instanceof Employee);

        $currentUser = $this->security->getUser();
        \assert($currentUser instanceof User);

        return $this->referralService->createReferral($data, $employee, $currentUser);
    }
}
