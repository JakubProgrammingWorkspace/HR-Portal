<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use App\Entity\Company;
use App\Entity\Employee;
use App\Entity\ExposureFactor;
use App\Entity\Referral;
use App\Entity\ReferralExposureFactor;
use App\Entity\User;
use App\Enum\ExaminationType;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ReferralCrudTest extends WebTestCase
{
    private \Symfony\Bundle\FrameworkBundle\KernelBrowser $client;
    private EntityManagerInterface $entityManager;
    private string $token;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();

        $this->entityManager = $container->get(EntityManagerInterface::class);

        $loader = new Loader();
        $loader->addFixture($container->get(AppFixtures::class));

        $purger = new ORMPurger($this->entityManager);
        $executor = new ORMExecutor($this->entityManager, $purger);
        $executor->execute($loader->getFixtures());

        $this->token = $this->loginAndGetToken('admin@hr-portal.local', 'admin123');
    }

    private function loginAndGetToken(string $email, string $password): string
    {
        $this->client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => $password]),
        );

        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        return $data['token'];
    }

    private function createEmployee(): Employee
    {
        $company = new Company();
        $company->setName('Acme Sp. z o.o.');
        $company->setNip('1234563218');
        $company->setStreet('ul. Testowa 1');
        $company->setCity('Warszawa');
        $company->setPostalCode('00-001');
        $this->entityManager->persist($company);

        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);

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
        $this->entityManager->flush();

        return $employee;
    }

    public function testCreatingReferralWithMultipleFactorsAcrossCategoriesSucceeds(): void
    {
        $employee = $this->createEmployee();

        $noiseFactor = $this->entityManager->getRepository(ExposureFactor::class)->findOneBy(['name' => 'Hałas']);
        $dustFactor = $this->entityManager->getRepository(ExposureFactor::class)->findOneBy(['name' => 'Pyły zawierające azbest']);
        $this->assertNotNull($noiseFactor);
        $this->assertNotNull($dustFactor);

        $this->client->request(
            'POST',
            '/api/referrals',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'employee' => '/api/employees/'.$employee->getId(),
                'examinationType' => 'okresowe',
                'jobPosition' => 'Operator maszyn',
                'jobDescription' => 'Obsługa maszyn produkcyjnych.',
                'issuePlace' => 'Warszawa',
                'issueDate' => '2026-06-13',
                'exposureFactors' => [
                    ['factor' => '/api/exposure-factors/'.$noiseFactor->getId(), 'exposureDetails' => '85 dB'],
                    ['factor' => '/api/exposure-factors/'.$dustFactor->getId(), 'exposureDetails' => '0,5 mg/m3'],
                ],
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('okresowe', $data['examinationType']);
        $this->assertSame('/api/employees/'.$employee->getId(), $data['employee']);
        $this->assertCount(2, $data['exposureFactorDetails']);

        $referral = $this->entityManager->getRepository(Referral::class)->findOneBy(['employee' => $employee]);
        $this->assertNotNull($referral);
        $this->assertSame(ExaminationType::Okresowe, $referral->getExaminationType());

        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);
        $this->assertSame($admin->getId(), $referral->getCreatedBy()->getId());

        $this->assertCount(2, $referral->getExposureFactors());
        $factorIds = array_map(
            static fn (ReferralExposureFactor $f) => $f->getFactor()->getId(),
            $referral->getExposureFactors()->toArray(),
        );
        $this->assertContains($noiseFactor->getId(), $factorIds);
        $this->assertContains($dustFactor->getId(), $factorIds);
    }

    public function testCreatingReferralWithInvalidExaminationTypeIsRejected(): void
    {
        $employee = $this->createEmployee();

        $this->client->request(
            'POST',
            '/api/referrals',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'employee' => '/api/employees/'.$employee->getId(),
                'examinationType' => 'roczne',
                'jobPosition' => 'Operator maszyn',
                'jobDescription' => 'Obsługa maszyn produkcyjnych.',
                'issuePlace' => 'Warszawa',
                'issueDate' => '2026-06-13',
                'exposureFactors' => [],
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('examinationType', $data['violations'][0]['propertyPath']);
    }

    public function testCreatingReferralWithNonExistentEmployeeIsRejected(): void
    {
        $this->client->request(
            'POST',
            '/api/referrals',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'employee' => '/api/employees/999999',
                'examinationType' => 'wstepne',
                'jobPosition' => 'Operator maszyn',
                'jobDescription' => 'Obsługa maszyn produkcyjnych.',
                'issuePlace' => 'Warszawa',
                'issueDate' => '2026-06-13',
                'exposureFactors' => [],
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('employee', $data['violations'][0]['propertyPath']);
    }

    public function testDeletingReferralSucceeds(): void
    {
        $employee = $this->createEmployee();
        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);

        $referral = new Referral();
        $referral->setEmployee($employee);
        $referral->setExaminationType(ExaminationType::Wstepne);
        $referral->setJobPosition('Operator maszyn');
        $referral->setJobDescription('Obsługa maszyn produkcyjnych.');
        $referral->setIssuePlace('Warszawa');
        $referral->setIssueDate(new \DateTimeImmutable('2026-06-13'));
        $referral->setCreatedBy($admin);

        $this->entityManager->persist($referral);
        $this->entityManager->flush();
        $referralId = $referral->getId();

        $this->client->request(
            'DELETE',
            '/api/referrals/'.$referralId,
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );

        $this->assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode());

        $this->entityManager->clear();
        $this->assertNull($this->entityManager->getRepository(Referral::class)->find($referralId));
    }

    private function createReferral(Employee $employee): Referral
    {
        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);

        $referral = new Referral();
        $referral->setEmployee($employee);
        $referral->setExaminationType(ExaminationType::Wstepne);
        $referral->setJobPosition('Operator maszyn');
        $referral->setJobDescription('Obsługa maszyn produkcyjnych.');
        $referral->setIssuePlace('Warszawa');
        $referral->setIssueDate(new \DateTimeImmutable('2026-06-13'));
        $referral->setCreatedBy($admin);

        $this->entityManager->persist($referral);
        $this->entityManager->flush();

        return $referral;
    }

    public function testGeneratingPdfSetsPdfPathAndGeneratedAt(): void
    {
        $employee = $this->createEmployee();
        $referral = $this->createReferral($employee);
        $referralId = $referral->getId();

        $this->client->request(
            'POST',
            '/api/referrals/'.$referralId.'/generate-pdf',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('var/referrals/'.$referralId.'.pdf', $data['pdfPath']);
        $this->assertNotNull($data['pdfGeneratedAt']);

        $this->entityManager->clear();
        $stored = $this->entityManager->getRepository(Referral::class)->find($referralId);
        $this->assertNotNull($stored);
        $this->assertSame('var/referrals/'.$referralId.'.pdf', $stored->getPdfPath());
        $this->assertNotNull($stored->getPdfGeneratedAt());

        $absolutePath = self::$kernel->getProjectDir().'/'.$stored->getPdfPath();
        $this->assertFileExists($absolutePath);

        unlink($absolutePath);
    }

    public function testDownloadingPdfReturns404BeforeGeneration(): void
    {
        $employee = $this->createEmployee();
        $referral = $this->createReferral($employee);

        $this->client->request(
            'GET',
            '/api/referrals/'.$referral->getId().'/pdf',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );

        $this->assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testDownloadingGeneratedPdfReturnsFile(): void
    {
        $employee = $this->createEmployee();
        $referral = $this->createReferral($employee);
        $referralId = $referral->getId();

        $this->client->request(
            'POST',
            '/api/referrals/'.$referralId.'/generate-pdf',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request(
            'GET',
            '/api/referrals/'.$referralId.'/pdf',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertGreaterThan(0, (int) $response->headers->get('Content-Length'));

        $this->entityManager->clear();
        $stored = $this->entityManager->getRepository(Referral::class)->find($referralId);
        $this->assertNotNull($stored);
        unlink(self::$kernel->getProjectDir().'/'.$stored->getPdfPath());
    }
}
