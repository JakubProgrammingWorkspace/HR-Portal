<?php

namespace App\Service;

use App\Dto\RoleCreateInput;
use App\Entity\Role;
use Doctrine\ORM\EntityManagerInterface;

class RoleService
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function createRole(RoleCreateInput $input): Role
    {
        $role = new Role();
        $role->setCode($input->code);
        $role->setName($input->name);
        $role->setDescription($input->description);

        $this->entityManager->persist($role);
        $this->entityManager->flush();

        return $role;
    }
}
