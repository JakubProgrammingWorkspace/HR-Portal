<?php

namespace App\Tests\DataFixtures;

use App\DataFixtures\DemoFixtures;
use App\Entity\Company;
use App\Entity\Employee;
use App\Entity\Referral;
use Doctrine\Common\DataFixtures\FixtureInterface;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\DependencyInjection\ContainerInterface;

class DemoFixturesTest extends KernelTestCase
{
    public function testDemoRecordsAreLoadedOnTopOfBaseFixtures(): void
    {
        self::bootKernel();
        $container = static::getContainer();

        /** @var EntityManagerInterface $entityManager */
        $entityManager = $container->get(EntityManagerInterface::class);

        // Resolve fixtures (and DemoFixtures' dependency on AppFixtures) from the container.
        $loader = new class($container) extends Loader {
            public function __construct(private readonly ContainerInterface $container)
            {
            }

            protected function createFixture(string $class): FixtureInterface
            {
                return $this->container->get($class);
            }
        };
        $loader->addFixture($container->get(DemoFixtures::class));

        (new ORMExecutor($entityManager, new ORMPurger($entityManager)))->execute($loader->getFixtures());

        $this->assertCount(4, $entityManager->getRepository(Company::class)->findAll());
        $this->assertCount(10, $entityManager->getRepository(Employee::class)->findAll());
        $this->assertCount(7, $entityManager->getRepository(Referral::class)->findAll());
    }
}
