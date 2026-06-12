<?php

namespace App\State;

use ApiPlatform\Metadata\IriConverterInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\EmployeeInput;
use App\Entity\Company;
use App\Entity\Employee;
use App\Repository\EmployeeRepository;
use App\Service\EmployeeService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProcessorInterface<EmployeeInput, Employee>
 */
class EmployeeUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EmployeeService $employeeService,
        private readonly EmployeeRepository $employeeRepository,
        private readonly IriConverterInterface $iriConverter,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Employee
    {
        $employee = $this->employeeRepository->find($uriVariables['id']);

        if (!$employee instanceof Employee) {
            throw new NotFoundHttpException('Pracownik nie został znaleziony.');
        }

        $company = $this->iriConverter->getResourceFromIri($data->company);
        \assert($company instanceof Company);

        return $this->employeeService->updateEmployee($employee, $data, $company);
    }
}
