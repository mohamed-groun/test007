<?php
declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260114XXXXXX extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création initiale des tables de toutes les entités';
    }

    public function up(Schema $schema): void
    {
        // Table User
        $this->addSql('CREATE TABLE user (
            id INT AUTO_INCREMENT NOT NULL,
            email VARCHAR(180) NOT NULL,
            roles JSON NOT NULL,
            password VARCHAR(255) NOT NULL,
            lastname VARCHAR(100) NOT NULL,
            firstname VARCHAR(100) NOT NULL,
            created_at DATETIME NOT NULL,
            UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email),
            PRIMARY KEY(id)
        )');

        // Table Contact
        $this->addSql('CREATE TABLE contact (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            number VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY(id)
        )');

        // Table ImagesFavorites
        $this->addSql('CREATE TABLE images_favorites (
            id INT AUTO_INCREMENT NOT NULL,
            id_user VARCHAR(50) NOT NULL,
            image_link VARCHAR(255) NOT NULL,
            PRIMARY KEY(id)
        )');

        // Table PdfParametres
        $this->addSql('CREATE TABLE pdf_parametres (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(100) NOT NULL,
            width DOUBLE PRECISION NOT NULL,
            height DOUBLE PRECISION NOT NULL,
            images_sheets LONGTEXT NOT NULL,
            images LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL,
            id_user VARCHAR(50) DEFAULT NULL,
            PRIMARY KEY(id)
        )');

        // Table Roll
        $this->addSql('CREATE TABLE roll (
            id INT AUTO_INCREMENT NOT NULL,
            width DOUBLE PRECISION NOT NULL,
            min_height DOUBLE PRECISION NOT NULL,
            max_height DOUBLE PRECISION NOT NULL,
            description VARCHAR(255) NOT NULL,
            id_user VARCHAR(50) NOT NULL,
            PRIMARY KEY(id)
        )');

        // Table Supports
        $this->addSql('CREATE TABLE supports (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(100) NOT NULL,
            width DOUBLE PRECISION NOT NULL,
            height DOUBLE PRECISION NOT NULL,
            description VARCHAR(255) NOT NULL,
            id_user VARCHAR(50) DEFAULT NULL,
            PRIMARY KEY(id)
        )');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE supports');
        $this->addSql('DROP TABLE roll');
        $this->addSql('DROP TABLE pdf_parametres');
        $this->addSql('DROP TABLE images_favorites');
        $this->addSql('DROP TABLE contact');
        $this->addSql('DROP TABLE user');
    }
}
