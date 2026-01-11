<?php
namespace App\Controller;

use App\Services\PayPalService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PayPalController extends AbstractController
{
    #[Route('/pricing', name: 'pricing')]
    public function pricing(): Response
    {
        return $this->render('payment/pricing.html.twig');
    }

    #[Route('/paypal/pass-day', name: 'paypal_pass_day')]
    public function passDay(PayPalService $paypal): Response
    {
        // Paiement unique → lien PayPal classique (checkout order)
        $approvalUrl = $paypal->createOneTimePayment(
            2.99,
            'Pass 1 jour',
            $this->generateUrl('paypal_success', [], 0),
            $this->generateUrl('paypal_cancel', [], 0)
        );

        return $this->redirect($approvalUrl);
    }

    #[Route('/paypal/subscribe', name: 'paypal_subscribe')]
    public function subscribe(PayPalService $paypal): Response
    {
        $planId = 'P-XXXXXXXX'; // plan mensuel PayPal

        $subscription = $paypal->createSubscription(
            $planId,
            $this->generateUrl('paypal_success', [], 0),
            $this->generateUrl('paypal_cancel', [], 0)
        );

        return $this->redirect(
            $paypal->getApproveLink($subscription)
        );
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
