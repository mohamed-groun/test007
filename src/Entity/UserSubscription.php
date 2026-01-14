<?php

namespace App\Entity;

use App\Repository\UserSubscriptionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserSubscriptionRepository::class)]
class UserSubscription
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'subscriptions')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private ?float $amount = null;

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $period = null; // ex: "1_day" ou "1_year"

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $startAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $endAt = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $paypalOrderId = null; // ID PayPal pour référence

    public function __construct()
    {
        $this->startAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getAmount(): ?float { return $this->amount; }
    public function setAmount(float $amount): static { $this->amount = $amount; return $this; }
    public function getPeriod(): ?string { return $this->period; }
    public function setPeriod(string $period): static { $this->period = $period; return $this; }
    public function getStartAt(): ?\DateTimeImmutable { return $this->startAt; }
    public function setStartAt(\DateTimeImmutable $startAt): static { $this->startAt = $startAt; return $this; }
    public function getEndAt(): ?\DateTimeImmutable { return $this->endAt; }
    public function setEndAt(\DateTimeImmutable $endAt): static { $this->endAt = $endAt; return $this; }
    public function getPaypalOrderId(): ?string { return $this->paypalOrderId; }
    public function setPaypalOrderId(?string $paypalOrderId): static { $this->paypalOrderId = $paypalOrderId; return $this; }
}
