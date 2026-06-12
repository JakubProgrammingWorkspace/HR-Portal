<?php

namespace App\DataFixtures;

use App\Entity\Role;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $adminRole = new Role();
        $adminRole->setCode('ROLE_ADMIN');
        $adminRole->setName('Administrator');
        $manager->persist($adminRole);

        $userRole = new Role();
        $userRole->setCode('ROLE_USER');
        $userRole->setName('Użytkownik');
        $manager->persist($userRole);

        $admin = new User();
        $admin->setEmail('admin@hr-portal.local');
        $admin->setFirstName('Admin');
        $admin->setLastName('Administrator');
        $admin->addRoleEntity($adminRole);
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'admin123'));
        $manager->persist($admin);

        $manager->flush();
    }
}
