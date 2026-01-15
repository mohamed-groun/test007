<?php

namespace App\Repository;

use App\Entity\UserSubscription;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserSubscriptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserSubscription::class);
    }

    /**
     * Vérifie si l'utilisateur a un abonnement actif aujourd'hui
     */
    public function isActiveForUser(int $userId): bool
    {
        $qb = $this->createQueryBuilder('s');

        $qb->select('COUNT(s.id)')
            ->where('s.user = :userId')
            ->andWhere('s.startAt <= :today')
            ->andWhere('s.endAt >= :today')
            ->setParameter('userId', $userId)
            ->setParameter('today', new \DateTime());

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * Récupère le dernier abonnement actif de l'utilisateur (ou null)
     */
    public function getActiveSubscriptionForUser(int $userId): ?UserSubscription
    {
        $qb = $this->createQueryBuilder('s');

        return $qb
            ->where('s.user = :userId')
            ->andWhere('s.startAt <= :today')
            ->andWhere('s.endAt >= :today')
            ->setParameter('userId', $userId)
            ->setParameter('today', new \DateTime())
            ->orderBy('s.endAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
