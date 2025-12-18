<?php
// src/Service/MultiPackService.php
namespace App\Services;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Psr\Log\LoggerInterface;

class MultiPackService
{
    private HttpClientInterface $httpClient;
    private LoggerInterface $logger;

    public function __construct(HttpClientInterface $httpClient, LoggerInterface $logger)
    {
        $this->httpClient = $httpClient;
        $this->logger = $logger;
    }

    public function sendMultiPackRequest(array $selectedFormats, array $images, float $margin, float $spacing): ?array
    {
        $url = "https://autoimpose-prod.realisaprint.com/multi-pack";

        $payload = [
            'formats' => array_values($selectedFormats),
            'images' => $images,
            'margin' => $margin * 10,
            'spacing' => $spacing * 10,
        ];

        try {
            $response = $this->httpClient->request('POST', $url, [
                'json' => $payload,
            ]);

            // Décodage JSON automatique
            $data = $response->toArray(false); // false permet de ne pas lever d'exception si HTTP != 2xx

            $statusCode = $response->getStatusCode();
            if ($statusCode !== 200) {
                $this->logger->warning("Multi-pack request returned status code $statusCode");
            }

            return $data;

        } catch (\Exception $e) {
            $this->logger->error("Multi-pack request exception: " . $e->getMessage());
            return null; // ici on retourne null seulement si exception technique (pas d'API response)
        }
    }
}
