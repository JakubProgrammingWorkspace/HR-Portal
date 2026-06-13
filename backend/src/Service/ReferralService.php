<?php

namespace App\Service;

use ApiPlatform\Metadata\Exception\InvalidArgumentException;
use ApiPlatform\Metadata\Exception\ItemNotFoundException;
use ApiPlatform\Metadata\IriConverterInterface;
use App\Dto\ReferralInput;
use App\Entity\Employee;
use App\Entity\ExposureFactor;
use App\Entity\Referral;
use App\Entity\ReferralExposureFactor;
use App\Entity\User;
use App\Enum\ExaminationType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ReferralService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly IriConverterInterface $iriConverter,
        private readonly ReferralPdfGeneratorService $pdfGenerator,
    ) {
    }

    public function createReferral(ReferralInput $input, Employee $employee, User $createdBy): Referral
    {
        $referral = new Referral();
        $referral->setEmployee($employee);
        $referral->setExaminationType(ExaminationType::from($input->examinationType));
        $referral->setJobPosition($input->jobPosition);
        $referral->setJobDescription($input->jobDescription);
        $referral->setIssuePlace($input->issuePlace);
        $referral->setIssueDate(new \DateTimeImmutable($input->issueDate));
        $referral->setCreatedBy($createdBy);

        foreach ($input->exposureFactors as $exposureFactorInput) {
            $factor = $this->resolveFactor($exposureFactorInput['factor'] ?? null);

            $referralFactor = new ReferralExposureFactor();
            $referralFactor->setFactor($factor);
            $referralFactor->setExposureDetails((string) ($exposureFactorInput['exposureDetails'] ?? ''));

            $referral->addExposureFactor($referralFactor);
        }

        $this->entityManager->persist($referral);
        $this->entityManager->flush();

        return $referral;
    }

    public function deleteReferral(Referral $referral): void
    {
        $this->entityManager->remove($referral);
        $this->entityManager->flush();
    }

    public function generatePdf(Referral $referral): Referral
    {
        $relativePath = $this->pdfGenerator->generate($referral);

        $referral->setPdfPath($relativePath);
        $referral->setPdfGeneratedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $referral;
    }

    private function resolveFactor(mixed $iri): ExposureFactor
    {
        if (!is_string($iri) || '' === $iri) {
            throw new UnprocessableEntityHttpException('Każdy wybrany czynnik narażenia musi zawierać identyfikator "factor".');
        }

        try {
            $resource = $this->iriConverter->getResourceFromIri($iri);
        } catch (InvalidArgumentException|ItemNotFoundException) {
            throw new UnprocessableEntityHttpException('Czynnik narażenia o podanym identyfikatorze nie istnieje.');
        }

        if (!$resource instanceof ExposureFactor) {
            throw new UnprocessableEntityHttpException('Czynnik narażenia o podanym identyfikatorze nie istnieje.');
        }

        return $resource;
    }
}
