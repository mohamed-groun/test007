<?php
// src/Controller/GeneratorController.php

namespace App\Controller;

use App\Entity\Roll;
use App\Entity\UserSubscription;
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

#[Route('/{_locale}',requirements: ['_locale' => 'fr|en'],defaults: ['_locale' => 'fr'])]
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
    public function calculate(
        Request $request,
        MultiPackService $multiPackService,
        EntityManagerInterface $em
    ): JsonResponse
    {
        $user = $this->getUser();
        $now = new \DateTimeImmutable();

        $isPremium =  $em->getRepository(UserSubscription::class)->isActiveForUser($user->getId());

        // Fichiers uploadés
        $files = $request->files->get('files', []);

        // Infos envoyées depuis le front
        $filesInfo = $request->request->all('files_info');     // files_info[UUID][...]
        $fileIds = $request->request->all('file_ids');       // file_ids[] dans le même ordre que files[]
        $support_ids = $request->request->get('support');      // "1,2,3" (string) ou array selon ton front
        $formatChoice = $request->request->get('format-choice');
        $margin = $request->request->get('margin');
        $space_between_logos = $request->request->get('space_between_logos');
        $with_banner = (bool)$request->request->get('with_banner', false);
        if ($with_banner == 0 && $isPremium == false) {
            return $this->premiumError(
                'Passez à l’abonnement Premium pour supprimer la bande en bas du format.'
            );
        }

        if ($space_between_logos != "0.5" && $isPremium == false) {
            return $this->premiumError(
                'Passez à l’abonnement Premium pour modifier l’espace entre les images.'
            );
        }

        if ($margin != "0.5" && $isPremium == false) {
            return $this->premiumError(
                'Passez à l’abonnement Premium pour modifier la marge entre l’image et le bord.'
            );
        }

        $fileDetails = [];

        // Dossier upload
        $pathFinale = $user ? '/' . $user->getId() : '/no-user';
        $uploadDir = $this->getParameter('uploads_directory') . $pathFinale;

        foreach ($files as $index => $file) {

            // ✅ récupère l'UUID associé à ce fichier (même ordre que files[])
            $uuid = $fileIds[$index] ?? null;

            // ✅ récupère les infos via UUID (sinon tableau vide)
            $info = ($uuid && isset($filesInfo[$uuid])) ? $filesInfo[$uuid] : [];

            $extension = $file->guessExtension() ?: $file->getClientOriginalExtension();
            $newFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)
                . '-' . $now->format('Ymd-His')
                . '-' . $index
                . '.' . $extension;

            $file->move($uploadDir, $newFilename);

            $fileUrl = $request->getSchemeAndHttpHost() . '/uploads' . $pathFinale . '/' . $newFilename;

            $fileDetails[] = [
                'name' => $fileUrl,
                'file' => $fileUrl,
                // Le front envoie en cm, ton service attend en mm => *10
                'width' => isset($info['width']) && $info['width'] !== ''
                    ? (float)$info['width'] * 10
                    : null,
                'height' => isset($info['height']) && $info['height'] !== ''
                    ? (float)$info['height'] * 10
                    : null,
                // ton multipack attend "quantity"
                'quantity' => isset($info['qty']) && $info['qty'] !== ''
                    ? (int)$info['qty']
                    : 1,
            ];
        }

        // Supports
        $supportDetails = [];

        // Ton support peut arriver en "1,2,3" ou déjà en array.
        if (is_array($support_ids)) {
            $supports_array = $support_ids;
        } else {
            $supports_array = array_filter(array_map('trim', explode(',', (string)$support_ids)));
        }

        foreach ($supports_array as $support_id) {
            $support = $em->getRepository(Supports::class)->find($support_id);

            if (!$support) {
                continue;
            }

            $usableHeight = $support->getHeight() * 10;
            if ($with_banner) {
                $usableHeight -= 10; // 1 cm = 10 mm
            }

            $supportDetails[] = [
                'id' => $support->getId(),
                'label' => $support->getName(),
                'width' => $support->getWidth() * 10,
                'height' => $usableHeight,
            ];
        }
        if (empty($supportDetails)) {
            $supports = $em->getRepository(Supports::class)->findBy([
                'id_user' => null
            ]);
            foreach ($supports as $support) {
                $usableHeight = $support->getHeight() * 10;
                if ($with_banner) {
                    $usableHeight -= 10; // 1 cm = 10 mm
                }
                $supportDetails[] = [
                    'id' => $support->getId(),
                    'label' => $support->getName(),
                    'width' => $support->getWidth() * 10,
                    'height' => $usableHeight,
                ];
            }
            $roll = $em->getRepository(Roll::class)->findOneBy(['id_user' => $user->getId()])
                ?? $em->getRepository(Roll::class)->findOneBy(['id_user' => null]);

            $min = (int)$roll->getMinHeight();
            $max = (int)$roll->getMaxHeight();

            for ($i = $min; $i <= $max; $i += 10) {
                $usableHeight = $i * 10;
                if ($with_banner) {
                    $usableHeight -= 10; // 1 cm = 10 mm
                }
                $supportDetails[] = [
                    'id' => $i + 1000,
                    'label' => $roll->getWidth() . '*' . $i,
                    'width' => $roll->getWidth() * 10,
                    'height' => $usableHeight,
                ];
            }

        }


        // Optionnel : logs debug

        // dump($fileDetails);
        // dump($margin);
        // dump($space_between_logos);

        // Appel multipack
        $result = $multiPackService->sendMultiPackRequest(
            $supportDetails,
            $fileDetails,
            $margin,
            $space_between_logos
        );

        if(isset($result['error_id'])) {
            return new JsonResponse($result, 400);
        }
        // Enregistrement DB (attention: tu utilisais $support hors scope si plusieurs supports)
        $pdfParam = new PdfParametres();
        $pdfParam->setName('pack-result-' . $now->format('Ymd-His'));
        $pdfParam->setIdUser($user ? $user->getId() : null);


        // Si tu veux stocker une taille support, prends le premier support, sinon null a corriger

        $pdfParam->setWidth($supportDetails[0]['width']);
        $pdfParam->setHeight($supportDetails[0]['height']);

        $pdfParam->setImagesSheets(json_encode($result));
        $pdfParam->setImages(json_encode($fileDetails));

        $em->persist($pdfParam);
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
        ini_set('memory_limit', '2G');

        $id_file = $request->request->get('id_file');

        $with_banner = (bool)$request->request->get('with_banner', false);
        $pdf = $em->getRepository(PdfParametres::class)->find($id_file);
        $json = $pdf->getImagessheets();
        $images = $pdf->getImages();

        $outputDir = $this->getParameter('uploads_directory') . '/pdfs/' . $pdf->getId();

        //dd($images);
        $zipPath = $outputDir . '/order_' . $pdf->getId() . '.zip';

// 🔥 CACHE ZIP
        if (file_exists($zipPath)) {
            return $this->file(
                $zipPath,
                basename($zipPath),
                ResponseHeaderBag::DISPOSITION_ATTACHMENT
            );
        }

// Sinon on génère
        $generatedFiles = $pdfsGenerator->generatePdfsFromJson(
            $json,
            $images,
            $outputDir,
            $pdf->getId(),
            $with_banner
        );
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
            'order_' . $pdf->getId() . '.zip',
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

    private function premiumError(string $message): JsonResponse
    {
        return new JsonResponse([
            'status' => 'failed',
            'error_id' => 'PREMIUM_REQUIRED',
            'message' => $message
        ], 403);
    }

}
