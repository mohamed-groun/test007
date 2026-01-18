<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260117072317 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE user_subscription (id INT AUTO_INCREMENT NOT NULL, amount NUMERIC(10, 2) NOT NULL, period VARCHAR(50) NOT NULL, start_at DATETIME NOT NULL, end_at DATETIME NOT NULL, paypal_order_id VARCHAR(255) DEFAULT NULL, user_id INT NOT NULL, INDEX IDX_230A18D1A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE user_subscription ADD CONSTRAINT FK_230A18D1A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE roll CHANGE id_user id_user VARCHAR(50) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user_subscription DROP FOREIGN KEY FK_230A18D1A76ED395');
        $this->addSql('DROP TABLE user_subscription');
        $this->addSql('ALTER TABLE roll CHANGE id_user id_user VARCHAR(50) DEFAULT NULL');
    }
}
