<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use App\Entity\Company;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class CompanyCrudTest extends WebTestCase
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

    public function testCreatingCompanySucceeds(): void
    {
        $this->client->request(
            'POST',
            '/api/companies',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'name' => 'Acme Sp. z o.o.',
                'nip' => '1234563218',
                'street' => 'ul. Testowa 1',
                'city' => 'Warszawa',
                'postalCode' => '00-001',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('Acme Sp. z o.o.', $data['name']);
        $this->assertSame('1234563218', $data['nip']);

        $created = $this->entityManager->getRepository(Company::class)->findOneBy(['nip' => '1234563218']);
        $this->assertNotNull($created);
        $this->assertSame('Warszawa', $created->getCity());
    }

    public function testCreatingCompanyWithInvalidNipIsRejected(): void
    {
        $this->client->request(
            'POST',
            '/api/companies',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'name' => 'Acme Sp. z o.o.',
                'nip' => '123',
                'street' => 'ul. Testowa 1',
                'city' => 'Warszawa',
                'postalCode' => '00-001',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('nip', $data['violations'][0]['propertyPath']);
    }

    public function testDeletingCompanyRemovesIt(): void
    {
        $company = new Company();
        $company->setName('Do Usunięcia');
        $company->setNip('9876543210');
        $company->setStreet('ul. Testowa 2');
        $company->setCity('Kraków');
        $company->setPostalCode('30-001');

        $this->entityManager->persist($company);
        $this->entityManager->flush();
        $id = $company->getId();

        $this->client->request(
            'DELETE',
            '/api/companies/'.$id,
            server: [
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_NO_CONTENT, $response->getStatusCode());

        $this->entityManager->clear();
        $this->assertNull($this->entityManager->getRepository(Company::class)->find($id));
    }
}
