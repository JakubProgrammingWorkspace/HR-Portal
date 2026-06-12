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

class UserManagementVoterTest extends WebTestCase
{
    private \Symfony\Bundle\FrameworkBundle\KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);

        $loader = new Loader();
        $loader->addFixture($container->get(AppFixtures::class));

        $purger = new ORMPurger($entityManager);
        $executor = new ORMExecutor($entityManager, $purger);
        $executor->execute($loader->getFixtures());

        $userRole = $entityManager->getRepository(Role::class)->findOneBy(['code' => 'ROLE_USER']);

        $regularUser = new User();
        $regularUser->setEmail('user@hr-portal.local');
        $regularUser->setFirstName('Regular');
        $regularUser->setLastName('User');
        $regularUser->addRoleEntity($userRole);

        $passwordHasher = $container->get(UserPasswordHasherInterface::class);
        $regularUser->setPassword($passwordHasher->hashPassword($regularUser, 'user12345'));

        $entityManager->persist($regularUser);
        $entityManager->flush();
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

    public function testNonAdminCannotAccessUsers(): void
    {
        $token = $this->loginAndGetToken('user@hr-portal.local', 'user12345');

        $this->client->request('GET', '/api/users', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);

        $this->assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testNonAdminCannotAccessRoles(): void
    {
        $token = $this->loginAndGetToken('user@hr-portal.local', 'user12345');

        $this->client->request('GET', '/api/roles', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);

        $this->assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testAdminCanAccessUsers(): void
    {
        $token = $this->loginAndGetToken('admin@hr-portal.local', 'admin123');

        $this->client->request('GET', '/api/users', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testAdminCanAccessRoles(): void
    {
        $token = $this->loginAndGetToken('admin@hr-portal.local', 'admin123');

        $this->client->request('GET', '/api/roles', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }
}
