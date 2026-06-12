<?php

namespace App\Service;

use App\Dto\ExposureFactorInput;
use App\Entity\ExposureCategory;
use App\Entity\ExposureFactor;
use App\Repository\ReferralExposureFactorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ExposureFactorService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ReferralExposureFactorRepository $referralExposureFactorRepository,
    ) {
    }

    public function createFactor(ExposureFactorInput $input, ExposureCategory $category): ExposureFactor
    {
        $factor = new ExposureFactor();
        $factor->setName($input->name);
        $factor->setCategory($category);
        $factor->setDescription($input->description);

        $this->entityManager->persist($factor);
        $this->entityManager->flush();

        return $factor;
    }

    public function deleteFactor(ExposureFactor $factor): void
    {
        if ($this->referralExposureFactorRepository->count(['factor' => $factor]) > 0) {
            throw new ConflictHttpException('Nie można usunąć czynnika narażenia, ponieważ jest używany w skierowaniach.');
        }

        $this->entityManager->remove($factor);
        $this->entityManager->flush();
    }
}
