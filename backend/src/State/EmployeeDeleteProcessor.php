<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Employee;
use App\Service\EmployeeService;

/**
 * @implements ProcessorInterface<Employee, void>
 */
class EmployeeDeleteProcessor implements ProcessorInterface
{
    public function __construct(private readonly EmployeeService $employeeService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $this->employeeService->deleteEmployee($data);
    }
}
