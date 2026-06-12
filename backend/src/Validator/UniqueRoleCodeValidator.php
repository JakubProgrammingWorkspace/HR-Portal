<?php

namespace App\Validator;

use App\Repository\RoleRepository;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class UniqueRoleCodeValidator extends ConstraintValidator
{
    public function __construct(private readonly RoleRepository $roleRepository)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof UniqueRoleCode) {
            throw new UnexpectedTypeException($constraint, UniqueRoleCode::class);
        }

        if (null === $value || '' === $value) {
            return;
        }

        if (null !== $this->roleRepository->findOneBy(['code' => $value])) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ code }}', (string) $value)
                ->addViolation();
        }
    }
}
