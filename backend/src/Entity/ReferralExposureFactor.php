<?php

namespace App\Entity;

use App\Repository\ReferralExposureFactorRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReferralExposureFactorRepository::class)]
class ReferralExposureFactor
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Referral::class, inversedBy: 'exposureFactors')]
    #[ORM\JoinColumn(nullable: false)]
    private Referral $referral;

    #[ORM\ManyToOne(targetEntity: ExposureFactor::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ExposureFactor $factor;

    #[ORM\Column(type: 'text')]
    private string $exposureDetails;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReferral(): Referral
    {
        return $this->referral;
    }

    public function setReferral(Referral $referral): static
    {
        $this->referral = $referral;

        return $this;
    }

    public function getFactor(): ExposureFactor
    {
        return $this->factor;
    }

    public function setFactor(ExposureFactor $factor): static
    {
        $this->factor = $factor;

        return $this;
    }

    public function getExposureDetails(): string
    {
        return $this->exposureDetails;
    }

    public function setExposureDetails(string $exposureDetails): static
    {
        $this->exposureDetails = $exposureDetails;

        return $this;
    }
}
