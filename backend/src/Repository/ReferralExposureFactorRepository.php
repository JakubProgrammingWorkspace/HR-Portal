<?php

namespace App\Repository;

use App\Entity\ReferralExposureFactor;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReferralExposureFactor>
 */
class ReferralExposureFactorRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReferralExposureFactor::class);
    }
}
