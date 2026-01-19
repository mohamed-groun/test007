<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HomePageController extends AbstractController
{
    #[Route('/', name: 'app_home_redirect')]
    public function redirectToLocale(): Response
    {
        // Redirige vers la locale par défaut 'fr'
        return $this->redirectToRoute('app_generator', ['_locale' => 'fr']);
    }
}
