<?php
// src/Controller/MultiPackController.php
namespace App\Controller;

use App\Services\MultiPackService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class MultiPackController extends AbstractController
{
    #[Route('/multi-pack-test', name: 'multi_pack_test')]
    public function test(MultiPackService $multiPackService): Response
    {
        $selectedFormats = ['A4', 'A5'];
        $images = ['image1.png', 'image2.png'];
        $margin = 2.5;
        $spacing = 1.5;

        $result = $multiPackService->sendMultiPackRequest($selectedFormats, $images, $margin, $spacing);

        return $this->json($result);
    }
}
