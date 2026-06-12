<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use App\Entity\Role;
use App\Entity\User;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class UserCrudTest extends WebTestCase
{
    private \Symfony\Bundle\FrameworkBundle\KernelBrowser $client;
    private EntityManagerInterface $entityManager;
    private string $adminToken;
    private int $adminId;

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

        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@hr-portal.local']);
        $this->adminId = $admin->getId();
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

    public function testAdminCanCreateUserWithRolesAndHashedPassword(): void
    {
        $this->client->request(
            'POST',
            '/api/users',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken,
            ],
            content: json_encode([
                'email' => 'new.user@hr-portal.local',
                'password' => 'newuser123',
                'firstName' => 'Nowy',
                'lastName' => 'Użytkownik',
                'roles' => ['ROLE_ADMIN'],
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('new.user@hr-portal.local', $data['email']);
        $this->assertArrayNotHasKey('password', $data);

        $created = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'new.user@hr-portal.local']);
        $this->assertNotNull($created);
        $this->assertNotSame('newuser123', $created->getPassword());
        $this->assertContains('ROLE_ADMIN', $created->getRoles());

        // The hashed password is valid for logging in.
        $token = $this->loginAndGetToken('new.user@hr-portal.local', 'newuser123');
        $this->assertNotEmpty($token);
    }

    public function testAdminCannotDeleteOwnAccount(): void
    {
        $this->client->request(
            'DELETE',
            '/api/users/'.$this->adminId,
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken],
        );

        $this->assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());

        $admin = $this->entityManager->getRepository(User::class)->find($this->adminId);
        $this->assertNotNull($admin);
    }

    public function testAdminCannotDeactivateOwnAccount(): void
    {
        $this->client->request(
            'PATCH',
            '/api/users/'.$this->adminId,
            server: [
                'CONTENT_TYPE' => 'application/merge-patch+json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken,
            ],
            content: json_encode(['isActive' => false]),
        );

        $this->assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());

        $this->entityManager->clear();
        $admin = $this->entityManager->getRepository(User::class)->find($this->adminId);
        $this->assertTrue($admin->isActive());
    }

    public function testAdminCanUpdateAndRemoveAnotherUser(): void
    {
        $userRole = $this->entityManager->getRepository(Role::class)->findOneBy(['code' => 'ROLE_USER']);

        $other = new User();
        $other->setEmail('other@hr-portal.local');
        $other->setFirstName('Inny');
        $other->setLastName('Pracownik');
        $other->addRoleEntity($userRole);
        $other->setPassword('placeholder');
        $this->entityManager->persist($other);
        $this->entityManager->flush();
        $otherId = $other->getId();

        $this->client->request(
            'PATCH',
            '/api/users/'.$otherId,
            server: [
                'CONTENT_TYPE' => 'application/merge-patch+json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken,
            ],
            content: json_encode(['firstName' => 'Zmieniony', 'roles' => ['ROLE_ADMIN'], 'isActive' => false]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('Zmieniony', $data['firstName']);

        $this->entityManager->clear();
        $updated = $this->entityManager->getRepository(User::class)->find($otherId);
        $this->assertFalse($updated->isActive());
        $this->assertContains('ROLE_ADMIN', $updated->getRoles());

        $this->client->request(
            'DELETE',
            '/api/users/'.$otherId,
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->adminToken],
        );

        $this->assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode());

        $this->entityManager->clear();
        $this->assertNull($this->entityManager->getRepository(User::class)->find($otherId));
    }
}
