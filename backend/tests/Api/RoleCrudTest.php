<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use App\Entity\Role;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class RoleCrudTest extends WebTestCase
{
    private \Symfony\Bundle\FrameworkBundle\KernelBrowser $client;
    private EntityManagerInterface $entityManager;
    private string $adminToken;

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

        $this->adminToken = $this->loginAndGetToken('admin@hr-portal.local', 'admin123');
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

    public function testAdminCanCreateNewRole(): void
    {
        $this->client->request(
            'POST',
            '/api/roles',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken,
            ],
            content: json_encode([
                'code' => 'ROLE_MANAGER',
                'name' => 'Kierownik',
                'description' => 'Rola kierownika zespołu',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('ROLE_MANAGER', $data['code']);
        $this->assertSame('Kierownik', $data['name']);

        $created = $this->entityManager->getRepository(Role::class)->findOneBy(['code' => 'ROLE_MANAGER']);
        $this->assertNotNull($created);
        $this->assertSame('Rola kierownika zespołu', $created->getDescription());
    }

    public function testCreatingRoleWithDuplicateCodeIsRejected(): void
    {
        $this->client->request(
            'POST',
            '/api/roles',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken,
            ],
            content: json_encode([
                'code' => 'ROLE_ADMIN',
                'name' => 'Duplikat',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('code', $data['violations'][0]['propertyPath']);
    }

    public function testCreatingRoleWithInvalidCodeFormatIsRejected(): void
    {
        $this->client->request(
            'POST',
            '/api/roles',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken,
            ],
            content: json_encode([
                'code' => 'manager',
                'name' => 'Kierownik',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('code', $data['violations'][0]['propertyPath']);
    }
}
