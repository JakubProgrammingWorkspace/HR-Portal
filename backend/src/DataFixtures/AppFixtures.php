<?php

namespace App\DataFixtures;

use App\Entity\ExposureCategory;
use App\Entity\ExposureFactor;
use App\Entity\Role;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    /**
     * @var array<string, array{name: string, factors: list<string>}>
     */
    private const EXPOSURE_CATEGORIES = [
        'I' => [
            'name' => 'Czynniki fizyczne',
            'factors' => [
                'Hałas',
                'Hałas ultradźwiękowy',
                'Wibracja (drgania mechaniczne) ogólne',
                'Wibracja (drgania mechaniczne) miejscowe',
                'Mikroklimat gorący',
                'Mikroklimat zimny',
                'Promieniowanie optyczne (UV/IR/widzialne)',
                'Promieniowanie laserowe',
                'Promieniowanie jonizujące',
                'Pole elektromagnetyczne',
                'Praca przy monitorach ekranowych powyżej 4 godzin dziennie',
            ],
        ],
        'II' => [
            'name' => 'Pyły',
            'factors' => [
                'Pyły zawierające azbest',
                'Pyły zawierające wolną krzemionkę',
                'Pyły drewna',
                'Pyły rud metali',
                'Pyły węgla',
                'Pyły mączne',
                'Pyły bawełny',
                'Pyły zwierzęce i roślinne niesklasyfikowane',
            ],
        ],
        'III' => [
            'name' => 'Czynniki chemiczne',
            'factors' => [
                'Substancje o działaniu toksycznym',
                'Substancje o działaniu drażniącym',
                'Substancje o działaniu uczulającym (alergizującym)',
                'Substancje o działaniu rakotwórczym lub mutagennym',
                'Substancje o działaniu szkodliwym na rozrodczość',
                'Rozpuszczalniki organiczne',
                'Metale i ich związki (ołów, rtęć, kadm, chrom, nikiel)',
                'Pestycydy',
                'Tlenek węgla',
                'Tlenki azotu',
            ],
        ],
        'IV' => [
            'name' => 'Czynniki biologiczne',
            'factors' => [
                'Wirusy',
                'Bakterie',
                'Grzyby (pleśnie)',
                'Pasożyty',
                'Materiał biologiczny pochodzenia ludzkiego (krew, płyny ustrojowe)',
                'Mikroorganizmy w środowisku pracy rolniczej/leśnej',
                'Kontakt ze zwierzętami',
            ],
        ],
        'V' => [
            'name' => 'Inne czynniki, w tym niebezpieczne',
            'factors' => [
                'Praca na wysokości',
                'Obsługa maszyn i urządzeń w ruchu',
                'Wymuszona pozycja ciała',
                'Obciążenie statyczne układu mięśniowo-szkieletowego',
                'Obciążenie dynamiczne (praca fizyczna ciężka)',
                'Praca w porze nocnej',
                'Praca zmianowa',
                'Obciążenie psychiczne związane z odpowiedzialnością/kontaktem z ludźmi',
                'Praca przy urządzeniach pod napięciem',
                'Praca w warunkach ograniczonej widoczności',
                'Ryzyko poślizgnięcia, potknięcia, upadku',
            ],
        ],
    ];

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

        $sortOrder = 1;
        foreach (self::EXPOSURE_CATEGORIES as $code => $data) {
            $category = new ExposureCategory();
            $category->setCode($code);
            $category->setName($data['name']);
            $category->setSortOrder($sortOrder++);
            $manager->persist($category);

            foreach ($data['factors'] as $factorName) {
                $factor = new ExposureFactor();
                $factor->setName($factorName);
                $factor->setCategory($category);
                $manager->persist($factor);
            }
        }

        $manager->flush();
    }
}
