<?php

namespace App\State;

use ApiPlatform\Metadata\IriConverterInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\EmployeeInput;
use App\Entity\Company;
use App\Entity\Employee;
use App\Entity\User;
use App\Service\EmployeeService;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProcessorInterface<EmployeeInput, Employee>
 */
class EmployeeCreateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EmployeeService $employeeService,
        private readonly IriConverterInterface $iriConverter,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Employee
    {
        $company = $this->iriConverter->getResourceFromIri($data->company);
        \assert($company instanceof Company);

        $currentUser = $this->security->getUser();
        \assert($currentUser instanceof User);

        return $this->employeeService->createEmployee($data, $company, $currentUser);
    }
}
