<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use App\Entity\ExposureCategory;
use App\Entity\ExposureFactor;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ExposureFactorCrudTest extends WebTestCase
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

    public function testListingCategoriesReturnsAllFiveWithFactors(): void
    {
        $this->client->request(
            'GET',
            '/api/exposure-categories',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertCount(5, $data);

        $codes = array_map(static fn (array $category) => $category['code'], $data);
        $this->assertSame(['I', 'II', 'III', 'IV', 'V'], $codes);

        $firstCategory = $data[0];
        $this->assertSame('Czynniki fizyczne', $firstCategory['name']);
        $this->assertNotEmpty($firstCategory['factors']);

        $factorNames = array_map(static fn (array $factor) => $factor['name'], $firstCategory['factors']);
        $this->assertContains('Hałas', $factorNames);
    }

    public function testAddingFactorToCategorySucceeds(): void
    {
        $category = $this->entityManager->getRepository(ExposureCategory::class)->findOneBy(['code' => 'I']);

        $this->client->request(
            'POST',
            '/api/exposure-factors',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'name' => 'Nowy czynnik testowy',
                'category' => '/api/exposure-categories/'.$category->getId(),
                'description' => 'Opis czynnika',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('Nowy czynnik testowy', $data['name']);
        $this->assertSame('/api/exposure-categories/'.$category->getId(), $data['category']);

        $created = $this->entityManager->getRepository(ExposureFactor::class)->findOneBy(['name' => 'Nowy czynnik testowy']);
        $this->assertNotNull($created);
        $this->assertSame($category->getId(), $created->getCategory()->getId());
    }

    public function testAddingFactorWithMissingCategoryIsRejected(): void
    {
        $this->client->request(
            'POST',
            '/api/exposure-factors',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$this->token,
            ],
            content: json_encode([
                'name' => 'Nowy czynnik testowy',
                'category' => '/api/exposure-categories/999999',
            ]),
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertSame('category', $data['violations'][0]['propertyPath']);
    }

    public function testRemovingFactorSucceeds(): void
    {
        $category = $this->entityManager->getRepository(ExposureCategory::class)->findOneBy(['code' => 'I']);

        $factor = new ExposureFactor();
        $factor->setName('Czynnik do usunięcia');
        $factor->setCategory($category);

        $this->entityManager->persist($factor);
        $this->entityManager->flush();
        $factorId = $factor->getId();

        $this->client->request(
            'DELETE',
            '/api/exposure-factors/'.$factorId,
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token],
        );

        $this->assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode());

        $this->entityManager->clear();
        $this->assertNull($this->entityManager->getRepository(ExposureFactor::class)->find($factorId));
    }
}
