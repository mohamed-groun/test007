<?php

namespace App\Repository;

use App\Entity\PdfParametres;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PdfParametres>
 */
class PdfParametresRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PdfParametres::class);
    }

    /**
     * Récupère les PDF d'un utilisateur avec download_count > 0, triés par date décroissante
     */
    public function findByUserWithDownloads(int $userId): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.id_user = :userId')
            ->andWhere('p.download_count > 0')
            ->setParameter('userId', $userId)
            ->orderBy('p.created_at', 'DESC')
            ->getQuery()
            ->getResult();
    }


    //    /**
    //     * @return PdfParametres[] Returns an array of PdfParametres objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('p.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?PdfParametres
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
