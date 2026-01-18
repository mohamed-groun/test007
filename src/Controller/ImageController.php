<?php
// src/Controller/ImageController.php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class ImageController extends AbstractController
{
    #[Route('/image-info', name: 'image_info', methods: ['POST'])]
    public function imageInfo(Request $request): JsonResponse
    {
        $uploadedFile = $request->files->get('file');
      /*  dd([
            'error' => $uploadedFile->getError(),
            'errorMessage' => $uploadedFile->getErrorMessage(),
            'size' => $uploadedFile->getSize(),
        ]); */

        if (!$uploadedFile) {
            return new JsonResponse(['error' => 'No file uploaded'], 400);
        }

        $path = $uploadedFile->getPathname();
        $extension = strtolower($uploadedFile->getClientOriginalExtension());

        $widthCm = null;
        $heightCm = null;

        if (in_array($extension, ['jpg', 'jpeg', 'png', 'tiff'])) {
            // Utilisation d'Imagick si disponible
            if (class_exists(\Imagick::class)) {

                $img = new \Imagick($path);
                $units = $img->getImageUnits();
                // Dimensions en pixels
                $widthPx = $img->getImageWidth();
                $heightPx = $img->getImageHeight();

                // DPI réel
                $xDpi = $img->getImageResolution()['x'] * 2.54;// fallback 96
                $yDpi = $img->getImageResolution()['y'] * 2.54;

                $dpi = (int) round($xDpi);

                // Conversion e;n cm
                $widthCm = round($widthPx * 2.54 / $dpi, 1);
                $heightCm = round($heightPx * 2.54 / $dpi, 1);
            }
            // Sinon fallback GD
            elseif (function_exists('getimagesize')) {

                $info = getimagesize($path);
                $widthPx = $info[0];
                $heightPx = $info[1];
                // GD ne donne pas le DPI, on met un fallback
                $dpi = 96;
                $widthCm = round($widthPx * 2.54 / $dpi, 1);
                $heightCm = round($heightPx * 2.54 / $dpi, 1);
            }
        }

        return new JsonResponse([
            'width_cm' => $widthCm,
            'height_cm' => $heightCm,
            'dpi' => $dpi,
        ]);
    }
}