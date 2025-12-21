<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251221142520 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE pdf_parametres ADD images_sheets LONGTEXT NOT NULL, ADD images LONGTEXT NOT NULL, ADD created_at DATETIME NOT NULL, DROP images_json, DROP images_positions');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE pdf_parametres ADD images_json LONGTEXT NOT NULL, ADD images_positions LONGTEXT NOT NULL, DROP images_sheets, DROP images, DROP created_at');
    }
}
