<?php

namespace App\Controller;

use App\Services\PayPalService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;


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
        // Créer un order PayPal pour le JS SDK
        $orderId = $paypal->createOrder(
            1.90,
            'Pass 1 jour',
            $this->generateUrl('paypal_success', [], UrlGeneratorInterface::ABSOLUTE_URL),
            $this->generateUrl('paypal_cancel', [], UrlGeneratorInterface::ABSOLUTE_URL)
        );

        return $this->json(['id' => $orderId]);
    }

    #[Route('/paypal/capture', name: 'paypal_capture', methods: ['POST'])]
    public function capture(Request $request, PayPalService $paypal): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $orderId = $data['orderID'] ?? null;

        if (!$orderId) {
            return $this->json(['error' => 'Order ID manquant'], 400);
        }

        $capture = $paypal->captureOrder($orderId);

        return $this->json($capture);
    }


    #[Route('/paypal/subscribe', name: 'paypal_subscribe')]
    public function subscribe(PayPalService $paypal): Response
    {
        $planId = 'P-XXXXXXXX'; // plan mensuel PayPal

        $subscription = $paypal->createSubscription(
            $planId,
            $this->generateUrl('paypal_success', [], UrlGeneratorInterface::ABSOLUTE_URL),
            $this->generateUrl('paypal_success', [], UrlGeneratorInterface::ABSOLUTE_URL)

        );

        return $this->redirect(
            $paypal->getApproveLink($subscription)
        );
    }

    #[Route('/paypal/subscription/success', name: 'paypal_subscription_success', methods: ['POST'])]
    public function subscriptionSuccess(Request $request, PayPalService $paypal): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $subscriptionId = $data['subscriptionID'] ?? null;

        if (!$subscriptionId) {
            return $this->json(['error' => 'Subscription ID manquant'], 400);
        }

        // Récupérer les infos de l’abonnement (optionnel mais recommandé)
        $subscription = $paypal->getSubscription($subscriptionId);

        // Ici tu peux activer l’abonnement en BDD
        // ex: $user->setSubscriptionId($subscriptionId), $user->setIsPremium(true)

        return $this->json(['status' => 'ok']);
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
