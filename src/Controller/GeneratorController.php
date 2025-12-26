<?php
// src/Controller/GeneratorController.php

namespace App\Controller;

use App\Services\MultiPackService;
use App\Entity\Supports;
use App\Entity\PdfParametres;
use App\Entity\ImagesFavorites;
use App\Services\PdfsGeneratorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;


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

        // Récupération des images favorites pour l'utilisateur
        $user = $this->getUser();
        $imagesFavorites = $em->getRepository(ImagesFavorites::class)->findBy([
            'id_user' => $user->getId()
        ]);

        // On garde juste le lien des images
        $favoritesLinks = array_map(fn($img) => $img->getImageLink(), $imagesFavorites);

        return $this->render('generator/index2.html.twig', [
            'supports' => $supports,
            'favorites' => $favoritesLinks,
        ]);
    }


#[Route('/generator/calculate', name: 'app_generator_calculate', methods: ['POST'])]
    public function calculate(Request $request, MultiPackService $multiPackService, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $now = new \DateTimeImmutable();
        $files = $request->files->get('files', []);

        $filesInfo = $request->request->all('files_info'); // <-- tableau complet
        $support_ids = $request->request->get('support');    // <-- tableau complet
        $formatChoice = $request->request->get('format-choice');
        $margin = $request->request->get('margin');
        $space_between_logos = $request->request->get('space_between_logos');

        $fileDetails = [];
        if ($user) {
            $pathFinale = '/' . $user->getId();
        } else {
            $pathFinale = '/no-user';
        }
        $uploadDir = $this->getParameter('uploads_directory') . $pathFinale;
        foreach ($files as $index => $file) {
            $extension = $file->guessExtension();
            $newFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)
                . '-' . $now->format('Ymd-His') . '.' . $extension;


            $file->move($uploadDir, $newFilename);

            // Générer l'URL accessible via le navigateur
            $fileUrl = $request->getSchemeAndHttpHost() . '/uploads' . $pathFinale . '/' . $newFilename;

            $fileDetails[] = [
                'name' => $fileUrl,
                'file' => $fileUrl,
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
        $supports_array = explode(",", $support_ids);
        foreach ($supports_array as $support_id) {
            $support = $em->getRepository(Supports::class)->find($support_id);

            $supportDetails[] = [
                'id' => $support->getId(),
                'label' => $support->getName(),
                'width' => $support->getWidth() * 10,
                'height' => $support->getHeight() * 10,
                // 'svg' => 'a4_portrait.svg',
                //      'is_roll' => 0,
                //     'visibility' => 1,
            ];
        }

        $result = $multiPackService->sendMultiPackRequest($supportDetails, $fileDetails, $margin, $space_between_logos);

        // add to PDf parametres
        $pdfParam = new PdfParametres();
        $pdfParam->setName($fileUrl);
        $pdfParam->setIdUser($user->getId());
        $pdfParam->setWidth($support->getWidth() * 10);
        $pdfParam->setHeight($support->getHeight() * 10);
        $pdfParam->setImagesSheets(json_encode($result));
        $pdfParam->setImages(json_encode($fileDetails));

        // 2. Persister l'objet
        $em->persist($pdfParam);

        // 3. Enregistrer dans la base de données
        $em->flush();
        return new JsonResponse([
            'status' => 'success',
            'id_file' => $pdfParam->getId(),
            'files' => $fileDetails,
            'supports' => $supportDetails,
            'formatChoice' => $formatChoice,
            'margin' => $margin,
            'space_between_logos' => $space_between_logos,
            'packingResult' => $result,
            'message' => 'Données reçues avec dimensions et quantités !'
        ]);
    }

    #[Route('/generator/download', name: 'app_generator_download', methods: ['POST'])]
    public function download(
        Request $request,
        PdfsGeneratorService $pdfsGenerator,
        MultiPackService $multiPackService,
        EntityManagerInterface $em
    ): Response
    {

        $id_file = $request->request->get('id_file');
        $pdf = $em->getRepository(PdfParametres::class)->find($id_file);
        $json = $pdf->getImagessheets();
        $images = $pdf->getImages();

        $outputDir = $this->getParameter('uploads_directory') . '/pdfs/' . $pdf->getId();
        $generatedFiles = $pdfsGenerator->generatePdfsFromJson($json, $images, $outputDir, 123);

        // Création d'un ZIP
        $zipPath = $outputDir . '/commande_123_pdfs.zip';
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
            foreach ($generatedFiles as $file) {
                $zip->addFile($file, basename($file));
            }
            $zip->close();
        } else {
            throw new \RuntimeException("Impossible de créer le ZIP");
        }

        return $this->file(
            $zipPath,
            'commande_123_pdfs.zip',
            ResponseHeaderBag::DISPOSITION_ATTACHMENT
        );
    }

#[Route('/generator/favorite', name: 'app_generator_favorite', methods: ['POST'])]
    public function favorite(Request $request, EntityManagerInterface $em)
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 403);
        }

        $imageLink = $request->request->get('image');
        $action = $request->request->get('action'); // 'add' ou 'remove'

        $repo = $em->getRepository(ImagesFavorites::class);

        if ($action === 'add') {
            $existing = $repo->findOneBy(['id_user' => $user->getId(), 'image_link' => $imageLink]);
            if (!$existing) {
                $fav = new ImagesFavorites();
                $fav->setIdUser($user->getId());
                $fav->setImageLink($imageLink);
                $em->persist($fav);
                $em->flush();
            }
            return $this->json(['success' => true, 'action' => 'added']);
        }

        if ($action === 'remove') {
            $existing = $repo->findOneBy(['id_user' => $user->getId(), 'image_link' => $imageLink]);
            if ($existing) {
                $em->remove($existing);
                $em->flush();
            }
            return $this->json(['success' => true, 'action' => 'removed']);
        }

        return $this->json(['success' => false, 'message' => 'Action invalide'], 400);
    }




}
