<?php

namespace App\Controller;

use App\Entity\ImagesFavorites;
use App\Entity\PdfParametres;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class DashboardController extends AbstractController
{
#[Route('/dashboard', name: 'app_dashboard')]
    public function index(EntityManagerInterface $em): Response
    {

        $user = $this->getUser();

        $pdfs = $em->getRepository(PdfParametres::class)->findBy(['id_user' => $user->getId()]);
        $images_favorites = $em->getRepository(ImagesFavorites::class)->findBy(['id_user' => $user->getId()]);

        // On récupère juste les liens des images favorites
        $favoritesLinks = array_map(fn($img) => $img->getImageLink(), $images_favorites);

        $pdfsView = [];
        foreach ($pdfs as $pdf) {
            $pdfsView[] = [
                'id' => $pdf->getId(),
                'createdAt' => $pdf->getCreatedAt(),
                'images' => json_decode($pdf->getImages(), true),
            ];
        }

        return $this->render('base-user-admin.html.twig', [
            'pdfs' => $pdfsView,
            'favorites' => $favoritesLinks, // ⚡ On passe ça à Twig
        ]);
    }

}
