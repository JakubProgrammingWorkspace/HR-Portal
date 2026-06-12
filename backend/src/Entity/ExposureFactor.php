<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Dto\ExposureFactorInput;
use App\Repository\ExposureFactorRepository;
use App\State\ExposureFactorCreateProcessor;
use App\State\ExposureFactorDeleteProcessor;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(
    operations: [
        new GetCollection(uriTemplate: '/exposure-factors'),
        new Get(uriTemplate: '/exposure-factors/{id}'),
        new Post(
            uriTemplate: '/exposure-factors',
            input: ExposureFactorInput::class,
            processor: ExposureFactorCreateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/exposure-factors/{id}',
            processor: ExposureFactorDeleteProcessor::class,
        ),
    ],
)]
#[ORM\Entity(repositoryClass: ExposureFactorRepository::class)]
class ExposureFactor
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\ManyToOne(targetEntity: ExposureCategory::class, inversedBy: 'factorEntities')]
    #[ORM\JoinColumn(nullable: false)]
    private ExposureCategory $category;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getCategory(): ExposureCategory
    {
        return $this->category;
    }

    public function setCategory(ExposureCategory $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }
}
