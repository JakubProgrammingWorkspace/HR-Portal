<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\RoleCreateInput;
use App\Entity\Role;
use App\Service\RoleService;

/**
 * @implements ProcessorInterface<RoleCreateInput, Role>
 */
class RoleCreateProcessor implements ProcessorInterface
{
    public function __construct(private readonly RoleService $roleService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Role
    {
        return $this->roleService->createRole($data);
    }
}
