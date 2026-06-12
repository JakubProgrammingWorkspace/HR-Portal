<?php

namespace App\Validator;

use ApiPlatform\Metadata\Exception\InvalidArgumentException;
use ApiPlatform\Metadata\Exception\ItemNotFoundException;
use ApiPlatform\Metadata\IriConverterInterface;
use App\Entity\ExposureCategory;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class ValidExposureCategoryReferenceValidator extends ConstraintValidator
{
    public function __construct(private readonly IriConverterInterface $iriConverter)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof ValidExposureCategoryReference) {
            throw new UnexpectedTypeException($constraint, ValidExposureCategoryReference::class);
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

        if (!$resource instanceof ExposureCategory) {
            $this->context->buildViolation($constraint->message)->addViolation();
        }
    }
}
