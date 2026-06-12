<?php

namespace App\Service;

use App\Dto\CompanyInput;
use App\Entity\Company;
use App\Repository\EmployeeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class CompanyService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly EmployeeRepository $employeeRepository,
    ) {
    }

    public function createCompany(CompanyInput $input): Company
    {
        $company = new Company();
        $this->applyInput($company, $input);

        $this->entityManager->persist($company);
        $this->entityManager->flush();

        return $company;
    }

    public function updateCompany(Company $company, CompanyInput $input): Company
    {
        $this->applyInput($company, $input);

        $this->entityManager->flush();

        return $company;
    }

    public function deleteCompany(Company $company): void
    {
        if ($this->employeeRepository->count(['company' => $company]) > 0) {
            throw new ConflictHttpException('Nie można usunąć firmy, ponieważ ma przypisanych pracowników.');
        }

        $this->entityManager->remove($company);
        $this->entityManager->flush();
    }

    private function applyInput(Company $company, CompanyInput $input): void
    {
        $company->setName($input->name);
        $company->setNip($input->nip);
        $company->setStreet($input->street);
        $company->setCity($input->city);
        $company->setPostalCode($input->postalCode);
    }
}
