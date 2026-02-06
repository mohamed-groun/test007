<?php

namespace App\Services;

use setasign\Fpdi\Tcpdf\Fpdi;
use Psr\Log\LoggerInterface;

class PdfsGeneratorService
{
    private LoggerInterface $logger;
    private string $basePath;

    public function __construct(
        LoggerInterface $logger,
        string $basePath
    ) {
        $this->logger   = $logger;
        $this->basePath = rtrim($basePath, '/').'/';
    }


    /**
     * Génération du PDF à partir du JSON
     */
    public function generatePdfsFromJson(
        string $json,
        string $originImages,
        string $outputDir,
        int $commandeId,
        bool $withBanner = false
    ): array {
        // Vérifie les images inversées
        $json = $this->checkInversedImages($originImages, $json);

        $data = json_decode($json, true);
        if ($data === null) {
            throw new \RuntimeException('JSON invalide');
        }

        $generatedFiles = [];

        foreach ($data as $formatKey => $formatData) {
            $formatWidth  = $formatData['width'];
            $formatHeight = $formatData['height'];

            // 1️⃣ Regrouper les sheets identiques
            $groupedSheets = [];
            foreach ($formatData['sheets'] as $sheet) {
                $signature = $this->getSheetSignature($sheet, $formatWidth, $formatHeight);
                if (!isset($groupedSheets[$signature])) {
                    $groupedSheets[$signature] = [
                        'sheet' => $sheet,
                        'count' => 1,
                    ];
                } else {
                    $groupedSheets[$signature]['count']++;
                }
            }

            // 2️⃣ Générer les PDFs par sheet unique
            $index = 1;
            $formatDirCreated = false;

            foreach ($groupedSheets as $group) {
                if (empty($group['sheet'])) {
                    continue; // aucun sheet réel, skip
                }

                // Crée le dossier seulement si nécessaire
                if (!$formatDirCreated) {
                    $formatDir = $outputDir . '/' . preg_replace('/[^\w\-]/', '_', $formatKey);
                    $this->createDir($formatDir);
                    $formatDirCreated = true;
                }

                $pdf = new Fpdi(
                    'P',
                    'mm',
                    [$formatWidth, $formatHeight],
                    true,
                    'UTF-8',
                    false
                );

                $pdf->SetMargins(0, 0, 0);
                $pdf->SetAutoPageBreak(false);
                $pdf->setPrintHeader(false);
                $pdf->setPrintFooter(false);
                $pdf->AddPage();

                // ===== Ajout du banner si demandé =====
                if ($withBanner) {
                    $pageCount = $pdf->getNumPages();
                    $pdf->setPage($pageCount);

                    $bannerHeight = 10;
                    $pageWidth  = $pdf->getPageWidth();
                    $pageHeight = $pdf->getPageHeight();

                    $pdf->SetFillColor(37, 99, 235);
                    $pdf->Rect(0, $pageHeight - $bannerHeight, $pageWidth, $bannerHeight, 'F');

                    $pdf->SetTextColor(255, 255, 255);
                    $pdf->SetFont('helvetica', 'B', 10);
                    $pdf->SetXY(0, $pageHeight - $bannerHeight + 1);
                    $pdf->Cell($pageWidth, $bannerHeight - 2, 'Made with love DTF Generator', 0, 0, 'C');
                }

                // Insertion des images
                foreach ($group['sheet'] as $img) {
                    $this->insertImage($pdf, $img, 1, $commandeId);
                }

                $count = $group['count'];

                // 🔹 Nom du PDF selon ton format souhaité
                $filename = sprintf(
                    '%s/logosSheet_%d_%dx%d_X%d.pdf',
                    $formatDir,
                    $index,
                    $formatData['width'],
                    $formatData['height'],
                    $count
                );

                // ⚡ Cache PDF : ne régénère que si absent
                if (!file_exists($filename)) {
                    $pdf->Output($filename, 'F');
                }

                $generatedFiles[] = $filename;
                $index++;
            }
        }

        return $generatedFiles;
    }
    
    /* ========================================================= */
    /* ======================= HELPERS ========================= */
    /* ========================================================= */

    private function insertImage(Fpdi $pdf, array $img, float $scale, int $commandeId): void
    {
        $path = $this->urlToPath($img['name']);

        if (!file_exists($path)) {
            $this->logError("{$commandeId} Fichier manquant : {$img['name']}");
            return;
        }

        $path = $this->normalizePng($path);
        $ext  = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        $x = $img['x'] * $scale;
        $y = $img['y'] * $scale;
        $w = $img['width'] * $scale;
        $h = $img['height'] * $scale;

        if ($ext === 'png') {
            if (($img['inversed'] ?? 0) === 1) {
                $pdf->StartTransform();
                $pdf->Rotate(90, $x, $y);
                $pdf->Image($path, $x - $h, $y, $h, $w, '', '', '', false, 300);
                $pdf->StopTransform();
            } else {
                $pdf->Image($path, $x, $y, $w, $h, '', '', '', false, 300);
            }
        }

        if ($ext === 'pdf') {
            $tempFile = $this->downgradePdfIfNeeded($path);
            try {
                $pdf->setSourceFile($tempFile);
                $tpl = $pdf->importPage(1);

                if (($img['inversed'] ?? 0) === 1) {
                    $pdf->StartTransform();
                    $pdf->Rotate(90, $x, $y);
                    $pdf->useTemplate($tpl, $x - $h, $y, $h, $w);
                    $pdf->StopTransform();
                } else {
                    $pdf->useTemplate($tpl, $x, $y, $w, $h);
                }
            } catch (\Throwable $e) {
                $this->logError("PDF import error : {$path} - {$e->getMessage()}");
            }

            if ($tempFile !== $path && file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    private function createDir(string $dir): void
    {
        if (!is_dir($dir) && !mkdir($dir, 0777, true)) {
            throw new \RuntimeException("Impossible de créer le dossier {$dir}");
        }
    }

    private function logError(string $message): void
    {
        $this->logger->error($message);
    }

    private function getSheetSignature(array $sheet, int $formatWidth, int $formatHeight): string
    {
        // On trie pour éviter les différences d'ordre
        $normalized = [
            'format' => [$formatWidth, $formatHeight],
            'sheet'  => $sheet,
        ];

        return md5(json_encode($normalized));
    }


    private function urlToPath(string $path): string
    {
        // Si c'est une URL complète
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $path = parse_url($path, PHP_URL_PATH);
        }

        // Si déjà absolu
        if (str_starts_with($path, '/')) {
            return $this->basePath . ltrim($path, '/');
        }

        return $this->basePath . ltrim($path, '/');
    }



    private function downgradePdfIfNeeded(string $path): string
    {
        $hash = md5_file($path);
        $newPath = sys_get_temp_dir() . '/pdf_' . $hash . '.pdf';

        // 🔥 CACHE
        if (file_exists($newPath)) {
            return $newPath;
        }


        $cmd = "gs -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH "
            . "-sDEVICE=pdfwrite "
            . "-sOutputFile=" . escapeshellarg($newPath) . " "
            . escapeshellarg($path);

        exec($cmd, $output, $code);

        return ($code === 0 && file_exists($newPath)) ? $newPath : $path;
    }

    private function normalizePng(string $path): string
    {
        if (!file_exists($path)) {
            return $path;
        }

        $hash = md5_file($path);
        $cached = sys_get_temp_dir() . '/png_' . $hash . '.png';

        // 🔥 CACHE
        if (file_exists($cached)) {
            return $cached;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $path);
        finfo_close($finfo);

        if ($mime !== 'image/png') {
            return $path;
        }

        $info = shell_exec(
            "identify -verbose " . escapeshellarg($path) . " 2>/dev/null"
        );

        if (!$info) {
            return $path;
        }

        if (!preg_match('/Profile-icc|png:iCCP/i', $info)) {
            return $path;
        }

        exec(
            "convert " . escapeshellarg($path) .
            " -strip -colorspace sRGB -depth 8 " .
            escapeshellarg($cached),
            $o,
            $code
        );

        return ($code === 0 && file_exists($cached)) ? $cached : $path;
    }


    private function checkInversedImages(string $images, string $json): string
    {
        $imagesArr = json_decode($images, true);
        $jsonArr   = json_decode($json, true);

        $dimensions = [];
        foreach ($imagesArr as $img) {
            $dimensions[$img['name']] = [
                'width'  => round($img['width'], 2),
                'height' => round($img['height'], 2),
            ];
        }

        foreach ($jsonArr as &$format) {
            foreach ($format['sheets'] as &$sheet) {
                foreach ($sheet as &$item) {
                    if (!is_array($item)) {
                        continue; // ignore les valeurs qui ne sont pas des images
                    }

                    $name = $item['name'];

                    if (!isset($dimensions[$name])) {
                        $item['inversed'] = 0;
                        continue;
                    }

                    $original   = $dimensions[$name];
                    $widthJson  = round($item['width'], 2);
                    $heightJson = round($item['height'], 2);

                    if ($item['rotated'] == 1) {
                        $item['inversed'] =
                            ($widthJson == $original['height'] &&
                                $heightJson == $original['width']) ? 1 : 0;
                    } else {
                        $item['inversed'] =
                            ($widthJson == $original['width'] &&
                                $heightJson == $original['height']) ? 0 : 1;
                    }
                }
            }
        }


        return json_encode($jsonArr, JSON_PRETTY_PRINT);
    }
}
