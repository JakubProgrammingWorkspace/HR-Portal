<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Dto\ReferralInput;
use App\Enum\ExaminationType;
use App\Repository\ReferralRepository;
use App\State\ReferralCreateProcessor;
use App\State\ReferralDeleteProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Ignore;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(
            input: ReferralInput::class,
            processor: ReferralCreateProcessor::class,
        ),
        new Delete(
            processor: ReferralDeleteProcessor::class,
        ),
    ],
    order: ['issueDate' => 'DESC'],
)]
#[ORM\Entity(repositoryClass: ReferralRepository::class)]
class Referral
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Employee::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Employee $employee;

    #[ORM\Column(length: 20, enumType: ExaminationType::class)]
    private ExaminationType $examinationType;

    #[ORM\Column(length: 255)]
    private string $jobPosition;

    #[ORM\Column(type: 'text')]
    private string $jobDescription;

    #[ORM\Column(length: 255)]
    private string $issuePlace;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $issueDate;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $createdBy;

    #[ORM\Column(nullable: true)]
    private ?string $pdfPath = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $pdfGeneratedAt = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    /**
     * @var Collection<int, ReferralExposureFactor>
     */
    #[Ignore]
    #[ORM\OneToMany(mappedBy: 'referral', targetEntity: ReferralExposureFactor::class, cascade: ['persist', 'remove'])]
    private Collection $exposureFactors;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->exposureFactors = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmployee(): Employee
    {
        return $this->employee;
    }

    public function setEmployee(Employee $employee): static
    {
        $this->employee = $employee;

        return $this;
    }

    public function getExaminationType(): ExaminationType
    {
        return $this->examinationType;
    }

    public function setExaminationType(ExaminationType $examinationType): static
    {
        $this->examinationType = $examinationType;

        return $this;
    }

    public function getJobPosition(): string
    {
        return $this->jobPosition;
    }

    public function setJobPosition(string $jobPosition): static
    {
        $this->jobPosition = $jobPosition;

        return $this;
    }

    public function getJobDescription(): string
    {
        return $this->jobDescription;
    }

    public function setJobDescription(string $jobDescription): static
    {
        $this->jobDescription = $jobDescription;

        return $this;
    }

    public function getIssuePlace(): string
    {
        return $this->issuePlace;
    }

    public function setIssuePlace(string $issuePlace): static
    {
        $this->issuePlace = $issuePlace;

        return $this;
    }

    public function getIssueDate(): \DateTimeImmutable
    {
        return $this->issueDate;
    }

    public function setIssueDate(\DateTimeImmutable $issueDate): static
    {
        $this->issueDate = $issueDate;

        return $this;
    }

    public function getCreatedBy(): User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function getPdfPath(): ?string
    {
        return $this->pdfPath;
    }

    public function setPdfPath(?string $pdfPath): static
    {
        $this->pdfPath = $pdfPath;

        return $this;
    }

    public function getPdfGeneratedAt(): ?\DateTimeImmutable
    {
        return $this->pdfGeneratedAt;
    }

    public function setPdfGeneratedAt(?\DateTimeImmutable $pdfGeneratedAt): static
    {
        $this->pdfGeneratedAt = $pdfGeneratedAt;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return Collection<int, ReferralExposureFactor>
     */
    public function getExposureFactors(): Collection
    {
        return $this->exposureFactors;
    }

    public function addExposureFactor(ReferralExposureFactor $exposureFactor): static
    {
        if (!$this->exposureFactors->contains($exposureFactor)) {
            $this->exposureFactors->add($exposureFactor);
            $exposureFactor->setReferral($this);
        }

        return $this;
    }

    /**
     * @return list<array{factor: int, factorName: string, exposureDetails: string}>
     */
    public function getExposureFactorDetails(): array
    {
        return array_values(array_map(
            static fn (ReferralExposureFactor $f): array => [
                'factor' => $f->getFactor()->getId(),
                'factorName' => $f->getFactor()->getName(),
                'exposureDetails' => $f->getExposureDetails(),
            ],
            $this->exposureFactors->toArray(),
        ));
    }
}
