<?php

namespace App\Service;

use App\Dto\EmployeeInput;
use App\Entity\Company;
use App\Entity\Employee;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class EmployeeService
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function createEmployee(EmployeeInput $input, Company $company, User $createdBy): Employee
    {
        $employee = new Employee();
        $employee->setCreatedBy($createdBy);
        $this->applyInput($employee, $input, $company);

        $this->entityManager->persist($employee);
        $this->entityManager->flush();

        return $employee;
    }

    public function updateEmployee(Employee $employee, EmployeeInput $input, Company $company): Employee
    {
        $this->applyInput($employee, $input, $company);

        $this->entityManager->flush();

        return $employee;
    }

    public function deleteEmployee(Employee $employee): void
    {
        $this->entityManager->remove($employee);
        $this->entityManager->flush();
    }

    private function applyInput(Employee $employee, EmployeeInput $input, Company $company): void
    {
        $employee->setFirstName($input->firstName);
        $employee->setLastName($input->lastName);
        $employee->setPesel($input->pesel);
        $employee->setPhone($input->phone);
        $employee->setEmail($input->email);
        $employee->setAddress($input->address);
        $employee->setCompany($company);
    }
}
