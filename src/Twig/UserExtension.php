<?php

namespace App\Twig;

use App\Repository\UserSubscriptionRepository;
use Symfony\Component\Security\Core\Security;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;

class UserExtension extends AbstractExtension implements GlobalsInterface
{
    private Security $security;
    private UserSubscriptionRepository $subscriptionRepository;

    public function __construct(Security $security, UserSubscriptionRepository $subscriptionRepository)
    {
        $this->security = $security;
        $this->subscriptionRepository = $subscriptionRepository;
    }

    public function getGlobals(): array
    {
        $user = $this->security->getUser();
        $isPremium = false;
        $subscriptionEnd = null;

        if ($user) {
            $subscription = $this->subscriptionRepository->getActiveSubscriptionForUser($user->getId());

            if ($subscription) {
                $isPremium = true;
                $subscriptionEnd = $subscription->getEndAt(); // Date de fin
            }
        }

        return [
            'is_premium' => $isPremium,
        ];
    }
}
