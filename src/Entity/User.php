<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[UniqueEntity(fields: ['email'], message: 'There is already an account with this email')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 100)]
    private ?string $lastname = null;

    #[ORM\Column(length: 100)]
    private ?string $firstname = null;

    #[ORM\Column(options: ['default' => 'CURRENT_TIMESTAMP'])]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserSubscription::class, cascade: ['persist', 'remove'])]
    private Collection $subscriptions;

    public function __construct()
    {
        $this->subscriptions = new ArrayCollection();
        $this->created_at = new \DateTimeImmutable();
    }

    // ===== Getters / Setters =====
    public function getId(): ?int { return $this->id; }
    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }
    public function getUserIdentifier(): string { return (string)$this->email; }
    public function getRoles(): array { return array_unique(array_merge($this->roles, ['ROLE_USER'])); }
    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }
    public function getPassword(): ?string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }
    #[\Deprecated] public function eraseCredentials(): void {}
    public function getLastname(): ?string { return $this->lastname; }
    public function setLastname(string $lastname): static { $this->lastname = $lastname; return $this; }
    public function getFirstname(): ?string { return $this->firstname; }
    public function setFirstname(string $firstname): static { $this->firstname = $firstname; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->created_at; }
    public function setCreatedAt(\DateTimeImmutable $created_at): static { $this->created_at = $created_at; return $this; }
    public function getSubscriptions(): Collection { return $this->subscriptions; }
    public function addSubscription(UserSubscription $subscription): static
    {
        if (!$this->subscriptions->contains($subscription)) {
            $this->subscriptions->add($subscription);
            $subscription->setUser($this);
        }
        return $this;
    }
    public function removeSubscription(UserSubscription $subscription): static
    {
        if ($this->subscriptions->removeElement($subscription)) {
            $subscription->setUser(null);
        }
        return $this;
    }
}
