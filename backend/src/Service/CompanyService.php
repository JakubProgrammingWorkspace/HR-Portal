<?php

namespace App\Service;

use App\Dto\CompanyInput;
use App\Entity\Company;
use Doctrine\ORM\EntityManagerInterface;

class CompanyService
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
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
