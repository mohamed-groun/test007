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

#[Route('/{_locale}',requirements: ['_locale' => 'fr|en|es|it|de'],defaults: ['_locale' => 'fr'])]
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
        if ($user) {
            $imagesFavorites = $em->getRepository(ImagesFavorites::class)->findBy([
                'id_user' => $user->getId()
            ]);
        } else {
            $imagesFavorites = [];
        }


        // On garde juste le lien des images
        $favoritesLinks = array_map(fn ($img) => $img->getImageLink(), $imagesFavorites);

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

        $isPremium = $user
            ? $em->getRepository(UserSubscription::class)->isActiveForUser($user->getId())
            : false;

        // =============================
        // Front data
        // =============================
        $files = $request->files->get('files', []);
        $filesInfo = $request->request->all('files_info');
        $fileIds = $request->request->all('file_ids');
        $supportIds = $request->request->get('support');
        $formatChoice = $request->request->get('format-choice');
        $margin = $request->request->get('margin', '0.5');
        $spaceBetween = $request->request->get('space_between_logos', '0.5');
        $withBanner = (bool)$request->request->get('with_banner', false);

        // =============================
        // Premium checks
        // =============================
        if (!$isPremium) {
            if (!$withBanner) {
                return $this->premiumError(
                    'Passez à l’abonnement Premium pour supprimer la bande en bas du format.'
                );
            }

            if ($spaceBetween !== '0.5') {
                return $this->premiumError(
                    'Passez à l’abonnement Premium pour modifier l’espace entre les images.'
                );
            }

            if ($margin !== '0.5') {
                return $this->premiumError(
                    'Passez à l’abonnement Premium pour modifier la marge.'
                );
            }
        }

        // =============================
        // Upload files
        // =============================
        $fileDetails = $this->handleFileUploads(
            $files,
            $filesInfo,
            $fileIds,
            $request,
            $now
        );

        // =============================
        // Supports
        // =============================
        $supportDetails = $this->buildSupportDetails(
            $supportIds,
            $withBanner,
            $em,
        );

        if (empty($supportDetails)) {
            return new JsonResponse(['error' => 'Aucun support valide'], 400);
        }

        // =============================
        // MultiPack
        // =============================
        $result = $multiPackService->sendMultiPackRequest(
            $supportDetails,
            $fileDetails,
            $margin,
            $spaceBetween
        );

        if (isset($result['error_id'])) {
            return new JsonResponse($result, 400);
        }

        // =============================
        // Persist PDF params
        // =============================
        $pdfParam = new PdfParametres();
        $pdfParam
            ->setName('pack-result-' . $now->format('Ymd-His'))
            ->setIdUser($user ?->getId())
            ->setWidth($supportDetails[0]['width'])
        ->setHeight($supportDetails[0]['height'])
        ->setImagesSheets(json_encode($result))
        ->setDownloadCount(0)
        ->setImages(json_encode($fileDetails));

    $em->persist($pdfParam);
    $em->flush();

    return new JsonResponse([
        'status' => 'success',
        'id_file' => $pdfParam->getId(),
        'files' => $fileDetails,
        'with_banner' => $withBanner,
        'supports' => $supportDetails,
        'formatChoice' => $formatChoice,
        'margin' => $margin,
        'space_between_logos' => $spaceBetween,
        'packingResult' => $result,
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

        if ($pdf) {
            // Incrémenter le compteur
            $pdf->setDownloadCount($pdf->getDownloadCount() + 1);
            // Persister le changement
            $em->persist($pdf);
            $em->flush();
        }
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

    private function handleFileUploads(
        array $files,
        array $filesInfo,
        array $fileIds,
        Request $request,
        \DateTimeImmutable $now
    ): array
    {
        $details = [];
        $user = $this->getUser();
        $path = $user ? '/' . $user->getId() : '/no-user';
        $uploadDir = $this->getParameter('uploads_directory') . $path;

        foreach ($files as $index => $file) {
            $uuid = $fileIds[$index] ?? null;
            $info = $uuid && isset($filesInfo[$uuid]) ? $filesInfo[$uuid] : [];

            $extension = $file->guessExtension() ?: $file->getClientOriginalExtension();
            $filename = sprintf(
                '%s-%s-%d.%s',
                pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                $now->format('Ymd-His'),
                $index,
                $extension
            );

            $file->move($uploadDir, $filename);

            $url = $request->getSchemeAndHttpHost() . '/uploads' . $path . '/' . $filename;

            $details[] = [
                'name' => $url,
                'file' => $url,
                'width' => isset($info['width']) ? (float)$info['width'] * 10 : null,
                'height' => isset($info['height']) ? (float)$info['height'] * 10 : null,
                'quantity' => isset($info['qty']) ? (int)$info['qty'] : 1,
            ];
        }

        return $details;
    }

    private function buildSupportDetails(
        mixed $supportIds,
        bool $withBanner,
        EntityManagerInterface $em
    ): array
    {
        $supports = [];
        $user = $this->getUser();

        $ids = is_array($supportIds)
            ? $supportIds
            : array_filter(explode(',', (string)$supportIds));

        foreach ($ids as $id) {
            if (!$support = $em->getRepository(Supports::class)->find($id)) {
                continue;
            }

            $supports[] = $this->formatSupport($support, $withBanner);
        }

        if (!empty($supports)) {
            return $supports;
        }

        // Default supports
        foreach ($em->getRepository(Supports::class)->findBy(['id_user' => null]) as $support) {
            $supports[] = $this->formatSupport($support, $withBanner);
        }

        // Roll
        $roll = $em->getRepository(Roll::class)->findOneBy([
            'id_user' => $user ?->getId()
    ]);

    if (!$roll) {
        return $supports;
    }

    for ($h = $roll->getMinHeight(); $h <= $roll->getMaxHeight(); $h += 10) {
        $height = $h * 10 - ($withBanner ? 10 : 0);

        $supports[] = [
            'id' => $h + 1000,
            'label' => $roll->getWidth() . '*' . $h,
            'width' => $roll->getWidth() * 10,
            'height' => $height,
        ];
    }

    return $supports;
}

    private function formatSupport(Supports $support, bool $withBanner): array
    {
        return [
            'id' => $support->getId(),
            'label' => $support->getName(),
            'width' => $support->getWidth() * 10,
            'height' => ($support->getHeight() * 10) - ($withBanner ? 10 : 0),
        ];
    }
}