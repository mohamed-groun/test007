<?php

namespace App\Controller;

use App\Services\PayPalService;
use App\Entity\UserSubscription ;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Doctrine\ORM\EntityManagerInterface;


class PayPalController extends AbstractController
{
    #[Route('/pricing', name: 'pricing')]
    public function pricing(): Response
    {
        return $this->render('paypal/pricing.html.twig');
    }

    #[Route('/paypal/pass-day', name: 'paypal_pass_day', methods: ['POST'])]
    public function passDay(PayPalService $paypal): JsonResponse
    {
        $orderId = $paypal->createOrder(
            1.90,
            'Pass 1 jour',
            $this->generateUrl('paypal_success', [], UrlGeneratorInterface::ABSOLUTE_URL),
            $this->generateUrl('paypal_cancel', [], UrlGeneratorInterface::ABSOLUTE_URL)
        );

        return $this->json(['id' => $orderId]);
    }

    #[Route('/paypal/pass-year', name: 'paypal_pass_year', methods: ['POST'])]
    public function passYear(PayPalService $paypal): JsonResponse
    {
        $orderId = $paypal->createOrder(
            119.88,
            'Pass annuel (12 mois)',
            $this->generateUrl('paypal_success', [], UrlGeneratorInterface::ABSOLUTE_URL),
            $this->generateUrl('paypal_cancel', [], UrlGeneratorInterface::ABSOLUTE_URL)
        );

        return $this->json(['id' => $orderId]);
    }

    #[Route('/paypal/capture', name: 'paypal_capture', methods: ['POST'])]
    public function capture(Request $request, PayPalService $paypal, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $orderId = $data['orderID'] ?? null;

        if (!$orderId) {
            return $this->json(['error' => 'Order ID manquant'], 400);
        }

        // Capture le paiement
        try {
            $capture = $paypal->captureOrder($orderId);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Capture échouée',
                'details' => $e->getMessage()
            ], 400);
        }


        // Vérifie l’utilisateur
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non connecté'], 403);
        }

        // Enregistrer l'abonnement dans la base
        $subscription = new UserSubscription();
        $subscription->setUser($user)
            ->setAmount(1.90)
            ->setPeriod('1_day')
            ->setPaypalOrderId($orderId)
            ->setStartAt(new \DateTimeImmutable())
            ->setEndAt((new \DateTimeImmutable())->modify('+1 day'));

        $em->persist($subscription);
        $em->flush();

        return $this->json($capture);
    }


#[Route('/paypal/capture-year', name: 'paypal_capture_year', methods: ['POST'])]
    public function captureYear(Request $request, PayPalService $paypal, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $orderId = $data['orderID'] ?? null;

        if (!$orderId) {
            return $this->json(['error' => 'Order ID manquant'], 400);
        }

        // Capture le paiement
        try {
            $capture = $paypal->captureOrder($orderId);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Capture échouée',
                'details' => $e->getMessage()
            ], 400);
        }


        // Enregistrer l'abonnement annuel
        $user = $this->getUser(); // utilisateur connecté
        $subscription = new UserSubscription();
        $subscription->setUser($user)
            ->setAmount(119.88)
            ->setPeriod('1_year')
            ->setPaypalOrderId($orderId)
            ->setStartAt(new \DateTimeImmutable())
            ->setEndAt((new \DateTimeImmutable())->modify('+1 year'));

        $em->persist($subscription);
        $em->flush();

        return $this->json($capture);
    }


    #[Route('/paypal/success', name: 'paypal_success')]
    public function success(): Response
    {
        return new Response('Paiement réussi 🎉');
    }

    #[Route('/paypal/cancel', name: 'paypal_cancel')]
    public function cancel(): Response
    {
        return new Response('Paiement annulé ❌');
    }
}
