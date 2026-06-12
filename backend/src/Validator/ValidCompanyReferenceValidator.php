<?php

namespace App\Validator;

use ApiPlatform\Metadata\Exception\InvalidArgumentException;
use ApiPlatform\Metadata\Exception\ItemNotFoundException;
use ApiPlatform\Metadata\IriConverterInterface;
use App\Entity\Company;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class ValidCompanyReferenceValidator extends ConstraintValidator
{
    public function __construct(private readonly IriConverterInterface $iriConverter)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof ValidCompanyReference) {
            throw new UnexpectedTypeException($constraint, ValidCompanyReference::class);
        }

        if (null === $value || '' === $value) {
            return;
        }

        try {
            $resource = $this->iriConverter->getResourceFromIri((string) $value);
        } catch (InvalidArgumentException|ItemNotFoundException) {
            $this->context->buildViolation($constraint->message)->addViolation();

            return;
        }

        if (!$resource instanceof Company) {
            $this->context->buildViolation($constraint->message)->addViolation();
        }
    }
}
