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

private function getAccessToken(): string {
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

public function captureOrder(string $orderId): array {
    $token = $this->getAccessToken();

    $response = $this->client->request('POST',
        $this->baseUrl . "/v2/checkout/orders/$orderId/capture",
        [
            'headers' => [
                'Authorization' => "Bearer $token",
                'Content-Type' => 'application/json'
            ],
        ]
    );

    return $response->toArray();
}



/* ================= UTILS ================= */

private function request(string $method, string $uri, array $payload): array {
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

public function createOrder(float $amount, string $description, string $returnUrl, string $cancelUrl): string {
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
}
