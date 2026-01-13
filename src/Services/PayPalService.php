<?php
namespace App\Services;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class PayPalService {
    private string $baseUrl;

    public function __construct(
        private HttpClientInterface $client,
        private string $clientId,
        private string $secret,
        private string $mode
    ) {
        $this->baseUrl = $mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

/* ================= TOKEN ================= */

private function getAccessToken(): string
{


    $response = $this->client->request(
        'POST',
        $this->baseUrl . '/v1/oauth2/token',
        [
            'auth_basic' => [$this->clientId, $this->secret],
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'body' => 'grant_type=client_credentials',
        ]
    );

    return $response->toArray()['access_token'];
}

public function captureOrder(string $orderId): array
{
    return $this->request('POST', "/v2/checkout/orders/$orderId/capture", []);
}


/* ================= PRODUCT ================= */

public function createProduct(): array
{
    return $this->request('POST', '/v1/catalogs/products', [
        'name' => 'Abonnement Premium',
        'type' => 'SERVICE'
    ]);
}

/* ================= PLAN ================= */

public function createPlan(string $productId, float $price): array
{
    return $this->request('POST', '/v1/billing/plans', [
        'product_id' => $productId,
        'name' => 'Plan Mensuel',
        'billing_cycles' => [[
            'frequency' => [
                'interval_unit' => 'MONTH',
                'interval_count' => 1
            ],
            'tenure_type' => 'REGULAR',
            'sequence' => 1,
            'total_cycles' => 0,
            'pricing_scheme' => [
                'fixed_price' => [
                    'value' => number_format($price, 2, '.', ''),
                    'currency_code' => 'EUR'
                ]
            ]
        ]],
        'payment_preferences' => [
            'auto_bill_outstanding' => true,
            'payment_failure_threshold' => 3
        ]
    ]);
}

/* ================= SUBSCRIPTION ================= */

public function createSubscription(string $planId, string $returnUrl, string $cancelUrl): array
{
    return $this->request('POST', '/v1/billing/subscriptions', [
        'plan_id' => $planId,
        'application_context' => [
            'brand_name' => 'MonSite',
            'locale' => 'fr-FR',
            'shipping_preference' => 'NO_SHIPPING',
            'user_action' => 'SUBSCRIBE_NOW',
            'return_url' => $returnUrl,
            'cancel_url' => $cancelUrl
        ]
    ]);
}


/* ================= UTILS ================= */

private function request(string $method, string $uri, array $payload): array
{
    $token = $this->getAccessToken();

    $response = $this->client->request($method,
        $this->baseUrl . $uri,
        [
            'headers' => [
                'Authorization' => "Bearer $token",
                'Content-Type' => 'application/json'
            ],
            'json' => $payload
        ]
    );

    return $response->toArray();
}

public function getApproveLink(array $subscription): string
{
    foreach ($subscription['links'] as $link) {
        if ($link['rel'] === 'approve') {
            return $link['href'];
        }
    }

    throw new \Exception('Lien PayPal introuvable');
}

public function createOneTimePayment(
    float $amount,
    string $description,
    string $returnUrl,
    string $cancelUrl
): string {
    $order = $this->request('POST', '/v2/checkout/orders', [
        'intent' => 'CAPTURE',
        'purchase_units' => [[
            'amount' => [
                'currency_code' => 'EUR',
                'value' => number_format($amount, 2, '.', '')
            ],
            'description' => $description
        ]],
        'application_context' => [
            'return_url' => $returnUrl,
            'cancel_url' => $cancelUrl
        ]
    ]);

    foreach ($order['links'] as $link) {
        if ($link['rel'] === 'approve') {
            return $link['href'];
        }
    }

    throw new \Exception('Lien PayPal introuvable');
}

public function createOrder(float $amount, string $description, string $returnUrl, string $cancelUrl): string
{
    // Crée un order PayPal et retourne juste l'ID
    $order = $this->request('POST', '/v2/checkout/orders', [
        'intent' => 'CAPTURE',
        'purchase_units' => [[
            'amount' => [
                'currency_code' => 'EUR',
                'value' => number_format($amount, 2, '.', '')
            ],
            'description' => $description
        ]],
        'application_context' => [
            'return_url' => $returnUrl,
            'cancel_url' => $cancelUrl
        ]
    ]);

    return $order['id']; // <-- pour JS SDK
}

public function getSubscription(string $subscriptionId): array
{
    return $this->request(
        'GET',
        "/v1/billing/subscriptions/$subscriptionId",
        []
    );
}


}
