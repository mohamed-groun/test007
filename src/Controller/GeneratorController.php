<?php
// src/Controller/GeneratorController.php

namespace App\Controller;

use App\Services\MultiPackService;
use App\Entity\Supports;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\EntityManagerInterface;


final class GeneratorController extends AbstractController
{
    #[Route('/', name: 'app_generator')]
    public function index(): Response
    {

        return $this->render('generator/index.html.twig');
    }

    #[Route('/index2', name: 'app_generator_2')]
    public function index2(EntityManagerInterface $em): Response
    {
        $supports = $em->getRepository(Supports::class)->findAll();

        return $this->render('generator/index2.html.twig', [
            'supports' => $supports,
        ]);
    }

#[Route('/generator/calculate', name: 'app_generator_calculate', methods: ['POST'])]
    public function calculate(Request $request, MultiPackService $multiPackService, EntityManagerInterface $em): JsonResponse
    {
        $now = new \DateTimeImmutable();
        $files = $request->files->get('files', []);

        $filesInfo = $request->request->all('files_info'); // <-- tableau complet
        $support_id = $request->request->get('support');    // <-- tableau complet
        $formatChoice = $request->request->get('format-choice');
        $margin = $request->request->get('margin');
        $gouttieres = $request->request->get('gouttieres');

        $fileDetails = [];

        foreach ($files as $index => $file) {
            $extension = $file->guessExtension();
            $newFilename = $file->getClientOriginalName() . '-' . $now->format('Ymd-His') . '.' . $extension;
            $file->move($this->getParameter('uploads_directory'), $newFilename);
            $fileDetails[] = [
                'name' => $file->getClientOriginalName(),
                'file' => $file->getClientOriginalName(),

                'width' => isset($filesInfo[$index]['width'])
                    ? (float)$filesInfo[$index]['width'] * 10
                    : null,

                'height' => isset($filesInfo[$index]['height'])
                    ? (float)$filesInfo[$index]['height'] * 10
                    : null,

                'quantity' => isset($filesInfo[$index]['qty'])
                    ? (int)$filesInfo[$index]['qty']
                    : 1,
            ];
        }

        $supportDetails = [];
        $support = $em->getRepository(Supports::class)->find($support_id);

        $supportDetails[] = [
            'id' => $support->getId(),
            'label' => $support->getName(),
            'width' => $support->getWidth() * 10,
            'height' => $support->getHeight() * 10 ,
            // 'svg' => 'a4_portrait.svg',
            //      'is_roll' => 0,
            //     'visibility' => 1,
        ];


        $result = $multiPackService->sendMultiPackRequest($supportDetails, $fileDetails, 0.5, 0.5);
        return new JsonResponse([
            'status' => 'success',
            'files' => $fileDetails,
            'supports' => $supportDetails,
            'formatChoice' => $formatChoice,
            'margin' => $margin,
            'gouttieres' => $gouttieres,
            'packingResult' => $result,
            'message' => 'Données reçues avec dimensions et quantités !'
        ]);
    }


}
