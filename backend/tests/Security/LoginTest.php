<?php

namespace App\Tests\Security;

use App\DataFixtures\AppFixtures;
use App\Entity\Role;
use App\Entity\User;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class LoginTest extends WebTestCase
{
    private \Symfony\Bundle\FrameworkBundle\KernelBrowser $client;
    private EntityManagerInterface $entityManager;

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

        $userRole = $this->entityManager->getRepository(Role::class)->findOneBy(['code' => 'ROLE_USER']);

        $inactiveUser = new User();
        $inactiveUser->setEmail('inactive@hr-portal.local');
        $inactiveUser->setFirstName('Inactive');
        $inactiveUser->setLastName('User');
        $inactiveUser->addRoleEntity($userRole);
        $inactiveUser->setIsActive(false);

        $passwordHasher = $container->get(UserPasswordHasherInterface::class);
        $inactiveUser->setPassword($passwordHasher->hashPassword($inactiveUser, 'inactive123'));

        $this->entityManager->persist($inactiveUser);
        $this->entityManager->flush();
    }

    public function testValidLoginReturnsJwtWithUserPayload(): void
    {
        $this->client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => 'admin@hr-portal.local', 'password' => 'admin123']),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertArrayHasKey('token', $data);

        [, $payloadPart] = explode('.', $data['token']);
        $payload = json_decode(base64_decode(strtr($payloadPart, '-_', '+/')), true);

        $this->assertSame('admin@hr-portal.local', $payload['email']);
        $this->assertContains('ROLE_ADMIN', $payload['roles']);
        $this->assertArrayHasKey('id', $payload);
    }

    public function testLoginWithInvalidCredentialsReturns401(): void
    {
        $this->client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => 'admin@hr-portal.local', 'password' => 'wrong-password']),
        );

        $this->assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testLoginAsInactiveUserIsRejected(): void
    {
        $this->client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => 'inactive@hr-portal.local', 'password' => 'inactive123']),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertArrayNotHasKey('token', $data);
    }

    public function testProtectedEndpointRequiresJwt(): void
    {
        $this->client->request('GET', '/api/health');
        $this->assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testProtectedEndpointAcceptsValidJwt(): void
    {
        $this->client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => 'admin@hr-portal.local', 'password' => 'admin123']),
        );

        $token = json_decode((string) $this->client->getResponse()->getContent(), true)['token'];

        $this->client->request('GET', '/api/health', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }
}
