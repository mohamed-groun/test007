<?php

namespace App\Controller;

use App\Entity\ImagesFavorites;
use App\Entity\PdfParametres;
use App\Entity\Supports;
use App\Entity\Roll;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class DashboardController extends AbstractController
{
#[Route('/dashboard', name: 'app_dashboard')]
    public function index(EntityManagerInterface $em): Response
    {
        $user = $this->getUser();
        $pdfs = $em->getRepository(PdfParametres::class)->findBy(
            ['id_user' => $user->getId()],  // critère
            ['created_at' => 'DESC']         // tri
        );

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

        return $this->render('dashboard/dashboard-user.html.twig', [
            'pdfs' => $pdfsView,
            'favorites' => $favoritesLinks, // ⚡ On passe ça à Twig
        ]);
    }

#[Route('/supports', name: 'dashboard_supports')]
    public function supports(EntityManagerInterface $em, Request $request): Response
    {
        $user = $this->getUser();

        // Supports globaux
        $globalSupports = $em->getRepository(Supports::class)->findBy([
            'id_user' => null
        ]);

        // Supports personnalisés de l'utilisateur
        $userSupports = $em->getRepository(Supports::class)->findBy([
            'id_user' => $user->getId()
        ]);

        $roll = $em->getRepository(Roll::class)->findOneBy([
            'id_user' => $user->getId()
        ]);

// Si aucune bobine personnalisée trouvée, récupérer celles par défaut
        if (empty($roll)) {
            $roll = $em->getRepository(Roll::class)->findOneBy([
                'id_user' => null
            ]);
        }

//dd($roll);
        return $this->render('dashboard/supports.html.twig', [
            'globalSupports' => $globalSupports,
            'userSupports' => $userSupports,
            'roll' => $roll,
        ]);
    }


#[Route('/support/add', name: 'support_add', methods: ['POST'])]
    public function addSupport(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();

        if (
            !$request->request->get('name') ||
            !$request->request->get('width') ||
            !$request->request->get('height')
        ) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Veuillez remplir tous les champs obligatoires.'
            ], 400);
        }

        $support = new Supports();
        $support->setName($request->request->get('name'));
        $support->setWidth($request->request->get('width'));
        $support->setHeight($request->request->get('height'));
        $support->setDescription($request->request->get('description'));
        $support->setIdUser($user->getId());

        $em->persist($support);
        $em->flush();

        return new JsonResponse([
            'status' => 'success',
            'message' => 'Support ajouté avec succès !',
            'support' => [
                'id' => $support->getId(),
                'name' => $support->getName(),
                'width' => $support->getWidth(),
                'height' => $support->getHeight(),
                'description' => $support->getDescription(),
            ]
        ]);
    }

#[Route('/roll/save', name: 'roll_save', methods: ['POST'])]
    public function saveRoll(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();

        $roll = $em->getRepository(Roll::class)->findOneBy([
            'id_user' => $user->getId()
        ]);

        if (!$roll) {
            $roll = new Roll();
            $roll->setIdUser($user->getId());
        }

        $roll->setWidth($request->request->get('width'));
        $roll->setMinHeight($request->request->get('min_height'));
        $roll->setMaxHeight($request->request->get('max_height'));
        $roll->setDescription($request->request->get('description', ''));

        $em->persist($roll);
        $em->flush();

        return new JsonResponse([
            'status' => 'success',
            'message' => 'Bobine mise à jour avec succès !',
            'roll' => [
                'width' => $roll->getWidth(),
                'min_height' => $roll->getMinHeight(),
                'max_height' => $roll->getMaxHeight(),
                'description' => $roll->getDescription(),
            ]
        ]);
    }

}
