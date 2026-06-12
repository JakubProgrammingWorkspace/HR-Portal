<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Dto\UserCreateInput;
use App\Dto\UserUpdateInput;
use App\Repository\UserRepository;
use App\State\UserCreateProcessor;
use App\State\UserDeleteProcessor;
use App\State\UserUpdateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Ignore;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(
            input: UserCreateInput::class,
            processor: UserCreateProcessor::class,
        ),
        new Patch(
            input: UserUpdateInput::class,
            processor: UserUpdateProcessor::class,
        ),
        new Delete(
            processor: UserDeleteProcessor::class,
        ),
    ],
)]
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    private string $email;

    #[ORM\Column]
    private string $password;

    #[ORM\Column(length: 100)]
    private string $firstName;

    #[ORM\Column(length: 100)]
    private string $lastName;

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    /**
     * @var Collection<int, Role>
     */
    #[Ignore]
    #[ORM\ManyToMany(targetEntity: Role::class)]
    #[ORM\JoinTable(name: 'user_role')]
    private Collection $roles;

    public function __construct()
    {
        $this->roles = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     */
    #[Ignore]
    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    #[Ignore]
    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return Collection<int, Role>
     */
    #[Ignore]
    public function getRoleEntities(): Collection
    {
        return $this->roles;
    }

    public function addRoleEntity(Role $role): static
    {
        if (!$this->roles->contains($role)) {
            $this->roles->add($role);
        }

        return $this;
    }

    public function removeRoleEntity(Role $role): static
    {
        $this->roles->removeElement($role);

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = array_map(static fn (Role $role) => $role->getCode(), $this->roles->toArray());
        $roles[] = 'ROLE_USER';

        return array_values(array_unique($roles));
    }

    /**
     * The Role codes explicitly assigned to this user (excludes the implicit
     * ROLE_USER added by getRoles()), exposed via the API for editing.
     *
     * @return list<string>
     */
    public function getRoleCodes(): array
    {
        return array_values(array_map(static fn (Role $role) => $role->getCode(), $this->roles->toArray()));
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function eraseCredentials(): void
    {
        // No sensitive temporary data stored on the user.
    }
}
