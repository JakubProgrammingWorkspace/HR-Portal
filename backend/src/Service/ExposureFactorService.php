<?php

namespace App\Service;

use App\Dto\ExposureFactorInput;
use App\Entity\ExposureCategory;
use App\Entity\ExposureFactor;
use Doctrine\ORM\EntityManagerInterface;

class ExposureFactorService
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
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
        $this->entityManager->remove($factor);
        $this->entityManager->flush();
    }
}
