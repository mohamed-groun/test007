<?php

namespace App\Controller;

use App\Entity\Contact;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class DashboardController extends AbstractController
{
    #[Route('/admin', name: 'app_dashboard')]
    public function index(EntityManagerInterface $em): Response
    {
        $contact = $em->getRepository(Contact::class)->findAll();

        return $this->render('dashboard/index.html.twig', [
            'contacts' => $contact,
        ]);
    }

    #[Route('/dashboard', name: 'dashboard_client')]
    public function dashboradClient(EntityManagerInterface $em): Response
    {
        $contact = $em->getRepository(Contact::class)->findAll();

        return $this->render('dashboard/index.html.twig', [
            'contacts' => $contact,
        ]);
    }
}
