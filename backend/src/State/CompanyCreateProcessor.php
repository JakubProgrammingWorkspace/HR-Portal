<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\CompanyInput;
use App\Entity\Company;
use App\Service\CompanyService;

/**
 * @implements ProcessorInterface<CompanyInput, Company>
 */
class CompanyCreateProcessor implements ProcessorInterface
{
    public function __construct(private readonly CompanyService $companyService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Company
    {
        return $this->companyService->createCompany($data);
    }
}
