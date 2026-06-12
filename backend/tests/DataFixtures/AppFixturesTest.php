<?php

namespace App\Tests\DataFixtures;

use App\DataFixtures\AppFixtures;
use App\Entity\ExposureCategory;
use App\Entity\User;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class AppFixturesTest extends KernelTestCase
{
    public function testAdminUserExistsWithRoleAdminAfterLoadingFixtures(): void
    {
        self::bootKernel();
        $container = static::getContainer();

        /** @var EntityManagerInterface $entityManager */
        $entityManager = $container->get(EntityManagerInterface::class);

        $loader = new Loader();
        $loader->addFixture($container->get(AppFixtures::class));

        $purger = new ORMPurger($entityManager);
        $executor = new ORMExecutor($entityManager, $purger);
        $executor->execute($loader->getFixtures());

        $admin = $entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);

        $this->assertNotNull($admin);
        $this->assertContains('ROLE_ADMIN', $admin->getRoles());
        $this->assertTrue($admin->isActive());
    }

    public function testExposureCategoriesAreSeededAfterLoadingFixtures(): void
    {
        self::bootKernel();
        $container = static::getContainer();

        /** @var EntityManagerInterface $entityManager */
        $entityManager = $container->get(EntityManagerInterface::class);

        $loader = new Loader();
        $loader->addFixture($container->get(AppFixtures::class));

        $purger = new ORMPurger($entityManager);
        $executor = new ORMExecutor($entityManager, $purger);
        $executor->execute($loader->getFixtures());

        $categories = $entityManager->getRepository(ExposureCategory::class)->findBy([], ['sortOrder' => 'ASC']);

        $this->assertCount(5, $categories);
        $this->assertSame(
            ['I', 'II', 'III', 'IV', 'V'],
            array_map(static fn (ExposureCategory $category) => $category->getCode(), $categories),
        );

        $physicalCategory = $categories[0];
        $this->assertSame('Czynniki fizyczne', $physicalCategory->getName());
        $factorNames = array_map(
            static fn ($factor) => $factor->getName(),
            $entityManager->getRepository(\App\Entity\ExposureFactor::class)->findBy(['category' => $physicalCategory]),
        );
        $this->assertContains('Hałas', $factorNames);
    }
}
