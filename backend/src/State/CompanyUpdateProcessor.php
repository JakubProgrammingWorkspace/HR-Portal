<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\CompanyInput;
use App\Entity\Company;
use App\Repository\CompanyRepository;
use App\Service\CompanyService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProcessorInterface<CompanyInput, Company>
 */
class CompanyUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly CompanyService $companyService,
        private readonly CompanyRepository $companyRepository,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Company
    {
        $company = $this->companyRepository->find($uriVariables['id']);

        if (!$company instanceof Company) {
            throw new NotFoundHttpException('Firma nie została znaleziona.');
        }

        return $this->companyService->updateCompany($company, $data);
    }
}
