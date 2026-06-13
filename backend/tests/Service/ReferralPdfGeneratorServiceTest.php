<?php

namespace App\Tests\Service;

use App\DataFixtures\AppFixtures;
use App\Entity\Company;
use App\Entity\Employee;
use App\Entity\ExposureFactor;
use App\Entity\Referral;
use App\Entity\ReferralExposureFactor;
use App\Entity\User;
use App\Enum\ExaminationType;
use App\Service\ReferralPdfGeneratorService;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class ReferralPdfGeneratorServiceTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        self::bootKernel();
        $container = static::getContainer();

        $this->entityManager = $container->get(EntityManagerInterface::class);

        $loader = new Loader();
        $loader->addFixture($container->get(AppFixtures::class));

        $purger = new ORMPurger($this->entityManager);
        $executor = new ORMExecutor($this->entityManager, $purger);
        $executor->execute($loader->getFixtures());
    }

    public function testGeneratePdfForReferralWithFactorsFromMultipleCategories(): void
    {
        $company = new Company();
        $company->setName('Acme Sp. z o.o.');
        $company->setNip('1234563218');
        $company->setStreet('ul. Testowa 1');
        $company->setCity('Warszawa');
        $company->setPostalCode('00-001');
        $this->entityManager->persist($company);

        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);
        $this->assertNotNull($admin);

        $employee = new Employee();
        $employee->setFirstName('Jan');
        $employee->setLastName('Kowalski');
        $employee->setPesel('90010112345');
        $employee->setPhone('600100200');
        $employee->setEmail('jan.kowalski@example.com');
        $employee->setAddress('ul. Polna 5, Warszawa');
        $employee->setCompany($company);
        $employee->setCreatedBy($admin);
        $this->entityManager->persist($employee);

        $noiseFactor = $this->entityManager->getRepository(ExposureFactor::class)->findOneBy(['name' => 'Hałas']);
        $dustFactor = $this->entityManager->getRepository(ExposureFactor::class)->findOneBy(['name' => 'Pyły zawierające azbest']);
        $this->assertNotNull($noiseFactor);
        $this->assertNotNull($dustFactor);

        $referral = new Referral();
        $referral->setEmployee($employee);
        $referral->setExaminationType(ExaminationType::Okresowe);
        $referral->setJobPosition('Operator maszyn');
        $referral->setJobDescription("Obsługa maszyn produkcyjnych.\nNadzór nad linią montażową.");
        $referral->setIssuePlace('Warszawa');
        $referral->setIssueDate(new \DateTimeImmutable('2026-06-13'));
        $referral->setCreatedBy($admin);

        $noise = new ReferralExposureFactor();
        $noise->setFactor($noiseFactor);
        $noise->setExposureDetails('85 dB');
        $referral->addExposureFactor($noise);

        $dust = new ReferralExposureFactor();
        $dust->setFactor($dustFactor);
        $dust->setExposureDetails('0,1 mg/m3');
        $referral->addExposureFactor($dust);

        $this->entityManager->persist($referral);
        $this->entityManager->flush();

        $service = static::getContainer()->get(ReferralPdfGeneratorService::class);
        $relativePath = $service->generate($referral);

        $this->assertSame('var/referrals/'.$referral->getId().'.pdf', $relativePath);

        $absolutePath = self::$kernel->getProjectDir().'/'.$relativePath;
        $this->assertFileExists($absolutePath);
        $this->assertGreaterThan(0, filesize($absolutePath));

        unlink($absolutePath);
    }
}
