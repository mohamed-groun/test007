<?php
// src/Controller/GeneratorController.php

namespace App\Controller;

use App\Services\MultiPackService;
use App\Entity\Supports;
use App\Entity\PdfParametres;
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
        $support_ids = $request->request->get('support');    // <-- tableau complet
        $formatChoice = $request->request->get('format-choice');
        $margin = $request->request->get('margin');
        $space_between_logos = $request->request->get('space_between_logos');
        $with_banner = (bool)$request->request->get('with_banner', false);

        //dd($request->request->all());
        $fileDetails = [];

        foreach ($files as $index => $file) {
            $extension = $file->guessExtension();
            $newFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)
                . '-' . $now->format('Ymd-His') . '.' . $extension;

            $uploadDir = $this->getParameter('uploads_directory'); // par ex: '%kernel.project_dir%/public/uploads'
            $file->move($uploadDir, $newFilename);

            // Générer l'URL accessible via le navigateur
            $fileUrl = $request->getSchemeAndHttpHost() . '/uploads/' . $newFilename;

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

            $usableHeight = $support->getHeight() * 10;

            if ($with_banner) {
                $usableHeight -= 10; // 1 cm
            }
            $supportDetails[] = [
                'id' => $support->getId(),
                'label' => $support->getName(),
                'width' => $support->getWidth() * 10,
                'height' => $usableHeight,
                // 'svg' => 'a4_portrait.svg',
                //      'is_roll' => 0,
                //     'visibility' => 1,
            ];
        }

        $result = $multiPackService->sendMultiPackRequest($supportDetails, $fileDetails, $margin, $space_between_logos);
        //dd($result);
        // add to PDf parametres
        $pdfParam = new PdfParametres();
        $pdfParam->setName($fileUrl);
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
            'with_banner' => $with_banner,
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
        $with_banner = (bool) $request->request->get('with_banner', false);
        $pdf = $em->getRepository(PdfParametres::class)->find($id_file);
        $json = $pdf->getImagessheets();
        $images = $pdf->getImages();

        $outputDir = $this->getParameter('uploads_directory') . '/pdfs/' . $pdf->getId();
        $generatedFiles = $pdfsGenerator->generatePdfsFromJson($json, $images, $outputDir, 123 , true);

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


}
