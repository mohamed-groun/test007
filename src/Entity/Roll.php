<?php

namespace App\Entity;

use App\Repository\RollRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RollRepository::class)]
class Roll
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?float $width = null;

    #[ORM\Column]
    private ?float $min_height = null;

    #[ORM\Column]
    private ?float $max_height = null;

    #[ORM\Column(length: 255)]
    private ?string $description = null;

    #[ORM\Column(length: 50)]
    private ?string $id_user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getWidth(): ?float
    {
        return $this->width;
    }

    public function setWidth(float $width): static
    {
        $this->width = $width;

        return $this;
    }

    public function getMinHeight(): ?float
    {
        return $this->min_height;
    }

    public function setMinHeight(float $min_height): static
    {
        $this->min_height = $min_height;

        return $this;
    }

    public function getMaxHeight(): ?float
    {
        return $this->max_height;
    }

    public function setMaxHeight(float $max_height): static
    {
        $this->max_height = $max_height;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getIdUser(): ?string
    {
        return $this->id_user;
    }

    public function setIdUser(string $id_user): static
    {
        $this->id_user = $id_user;

        return $this;
    }
}
