<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use App\Entity\Company;
use App\Entity\Employee;
use App\Entity\User;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class EmployeeCrudTest extends WebTestCase
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

    private function createCompany(string $nip): Company
    {
        $company = new Company();
        $company->setName('Acme Sp. z o.o.');
        $company->setNip($nip);
        $company->setStreet('ul. Testowa 1');
        $company->setCity('Warszawa');
        $company->setPostalCode('00-001');

        $this->entityManager->persist($company);
        $this->entityManager->flush();

        return $company;
    }

    public function testCreatingEmployeeWithCompanyLinkSucceeds(): void
    {
        $company = $this->createCompany('1234563218');

        $this->client->request(
            'POST',
            '/api/employees',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'firstName' => 'Jan',
                'lastName' => 'Kowalski',
                'pesel' => '90010112345',
                'phone' => '600100200',
                'email' => 'jan.kowalski@example.com',
                'address' => 'ul. Polna 5, Warszawa',
                'company' => '/api/companies/'.$company->getId(),
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('Jan', $data['firstName']);
        $this->assertSame('/api/companies/'.$company->getId(), $data['company']);

        $created = $this->entityManager->getRepository(Employee::class)->findOneBy(['pesel' => '90010112345']);
        $this->assertNotNull($created);
        $this->assertSame($company->getId(), $created->getCompany()->getId());

        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);
        $this->assertSame($admin->getId(), $created->getCreatedBy()->getId());
    }

    public function testCreatingEmployeeWithInvalidPeselIsRejected(): void
    {
        $company = $this->createCompany('1234563218');

        $this->client->request(
            'POST',
            '/api/employees',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'firstName' => 'Jan',
                'lastName' => 'Kowalski',
                'pesel' => '123',
                'phone' => '600100200',
                'email' => 'jan.kowalski@example.com',
                'address' => 'ul. Polna 5, Warszawa',
                'company' => '/api/companies/'.$company->getId(),
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('pesel', $data['violations'][0]['propertyPath']);
    }

    public function testCreatingEmployeeWithMissingCompanyIsRejected(): void
    {
        $this->client->request(
            'POST',
            '/api/employees',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'firstName' => 'Jan',
                'lastName' => 'Kowalski',
                'pesel' => '90010112345',
                'phone' => '600100200',
                'email' => 'jan.kowalski@example.com',
                'address' => 'ul. Polna 5, Warszawa',
                'company' => '/api/companies/999999',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('company', $data['violations'][0]['propertyPath']);
    }

    public function testDeletingCompanyWithEmployeesReturns409(): void
    {
        $company = $this->createCompany('1234563218');

        $employee = new Employee();
        $employee->setFirstName('Jan');
        $employee->setLastName('Kowalski');
        $employee->setPesel('90010112345');
        $employee->setPhone('600100200');
        $employee->setEmail('jan.kowalski@example.com');
        $employee->setAddress('ul. Polna 5, Warszawa');
        $employee->setCompany($company);

        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);
        $employee->setCreatedBy($admin);

        $this->entityManager->persist($employee);
        $this->entityManager->flush();

        $this->client->request(
            'DELETE',
            '/api/companies/'.$company->getId(),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );

        $this->assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());

        $this->entityManager->clear();
        $this->assertNotNull($this->entityManager->getRepository(Company::class)->find($company->getId()));
    }
}
