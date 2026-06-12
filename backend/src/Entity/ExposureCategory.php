<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\ExposureCategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Ignore;

#[ApiResource(
    operations: [
        new GetCollection(uriTemplate: '/exposure-categories'),
        new Get(uriTemplate: '/exposure-categories/{id}'),
    ],
    order: ['sortOrder' => 'ASC'],
)]
#[ORM\Entity(repositoryClass: ExposureCategoryRepository::class)]
class ExposureCategory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 10, unique: true)]
    private string $code;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column]
    private int $sortOrder;

    /**
     * @var Collection<int, ExposureFactor>
     */
    #[Ignore]
    #[ORM\OneToMany(mappedBy: 'category', targetEntity: ExposureFactor::class)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $factorEntities;

    public function __construct()
    {
        $this->factorEntities = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = $code;

        return $this;
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

    public function getSortOrder(): int
    {
        return $this->sortOrder;
    }

    public function setSortOrder(int $sortOrder): static
    {
        $this->sortOrder = $sortOrder;

        return $this;
    }

    /**
     * @return list<array{id: int, name: string, description: ?string}>
     */
    public function getFactors(): array
    {
        return array_values(array_map(
            static fn (ExposureFactor $factor): array => [
                'id' => $factor->getId(),
                'name' => $factor->getName(),
                'description' => $factor->getDescription(),
            ],
            $this->factorEntities->toArray(),
        ));
    }
}
