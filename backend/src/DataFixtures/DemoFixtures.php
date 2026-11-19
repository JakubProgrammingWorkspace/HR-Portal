<?php

namespace App\DataFixtures;

use App\Entity\Company;
use App\Entity\Employee;
use App\Entity\ExposureFactor;
use App\Entity\Referral;
use App\Entity\ReferralExposureFactor;
use App\Entity\Role;
use App\Entity\User;
use App\Enum\ExaminationType;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Fictional Polish demo records (companies, employees, referrals, a second user).
 * All names, NIP and PESEL numbers are made up.
 * Load with: bin/console doctrine:fixtures:load --group=demo
 * (this also loads the base fixtures it depends on).
 */
class DemoFixtures extends Fixture implements DependentFixtureInterface, FixtureGroupInterface
{
    /** @var list<array{string, string, string, string, string}> name, NIP, street, city, postal code */
    private const COMPANIES = [
        ['Budimex Przykład Sp. z o.o.', '5260001246', 'ul. Stawki 40', 'Warszawa', '01-040'],
        ['Zakłady Mechaniczne Stalex S.A.', '6340134221', 'ul. Fabryczna 12', 'Katowice', '40-001'],
        ['Piekarnia Rodzinna Kowalscy', '7792369800', 'ul. Świętokrzyska 8', 'Poznań', '60-101'],
        ['LogiTrans Polska Sp. z o.o.', '9512347760', 'ul. Magazynowa 3', 'Łódź', '90-001'],
    ];

    /** @var list<array{string, string, string, string, int, string}> first name, last name, PESEL, email, company index, address */
    private const EMPLOYEES = [
        ['Anna', 'Nowak', '85010112345', 'anna.nowak@example.pl', 0, 'Warszawa, ul. Złota 1/4'],
        ['Piotr', 'Kowalczyk', '79030423456', 'piotr.kowalczyk@example.pl', 0, 'Warszawa, ul. Prosta 22'],
        ['Katarzyna', 'Wiśniewska', '90061534567', 'katarzyna.wisniewska@example.pl', 1, 'Katowice, ul. Mikołowska 15'],
        ['Tomasz', 'Wójcik', '82112045678', 'tomasz.wojcik@example.pl', 1, 'Chorzów, ul. Wolności 7'],
        ['Agnieszka', 'Kamińska', '93020856789', 'agnieszka.kaminska@example.pl', 2, 'Poznań, ul. Półwiejska 30'],
        ['Michał', 'Lewandowski', '88090767890', 'michal.lewandowski@example.pl', 2, 'Poznań, ul. Dębiecka 5'],
        ['Joanna', 'Zielińska', '95071178901', 'joanna.zielinska@example.pl', 3, 'Łódź, ul. Piotrkowska 101'],
        ['Paweł', 'Szymański', '76051289012', 'pawel.szymanski@example.pl', 3, 'Zgierz, ul. Długa 9'],
        ['Magdalena', 'Woźniak', '91121390123', 'magdalena.wozniak@example.pl', 1, 'Gliwice, ul. Zwycięstwa 44'],
        ['Krzysztof', 'Dąbrowski', '84040201234', 'krzysztof.dabrowski@example.pl', 3, 'Łódź, ul. Kilińskiego 18'],
    ];

    /** @var list<array{int, ExaminationType, string, string, string, string, string, string}> employee index, type, job, description, factor, details, issue date, place */
    private const REFERRALS = [
        [0, ExaminationType::Wstepne, 'Księgowa', 'Prowadzenie ksiąg rachunkowych, praca przy komputerze.', 'Praca przy monitorach ekranowych powyżej 4 godzin dziennie', 'Ok. 6 godz. dziennie', '2026-11-02', 'Warszawa'],
        [2, ExaminationType::Okresowe, 'Operator CNC', 'Obsługa obrabiarek CNC w hali produkcyjnej.', 'Hałas', 'Poziom 87 dB(A), 8 godz. dziennie', '2026-11-05', 'Katowice'],
        [3, ExaminationType::Okresowe, 'Spawacz', 'Spawanie konstrukcji stalowych metodą MAG.', 'Metale i ich związki (ołów, rtęć, kadm, chrom, nikiel)', 'Dym spawalniczy, ekspozycja 6 godz.', '2026-11-07', 'Chorzów'],
        [4, ExaminationType::Kontrolne, 'Piekarz', 'Wypiek pieczywa, praca w wysokiej temperaturze.', 'Pyły mączne', 'Stężenie poniżej NDS', '2026-11-10', 'Poznań'],
        [6, ExaminationType::Wstepne, 'Kierowca-magazynier', 'Załadunek i rozładunek, prowadzenie wózka widłowego.', 'Praca zmianowa', 'System dwuzmianowy', '2026-11-12', 'Łódź'],
        [7, ExaminationType::Okresowe, 'Operator wózka widłowego', 'Transport wewnętrzny w magazynie.', 'Wibracja (drgania mechaniczne) ogólne', 'Ekspozycja ok. 5 godz. dziennie', '2026-11-14', 'Zgierz'],
        [8, ExaminationType::Wstepne, 'Lakiernik', 'Lakierowanie elementów konstrukcji stalowych.', 'Rozpuszczalniki organiczne', 'Praca w kabinie lakierniczej', '2026-11-16', 'Gliwice'],
    ];

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public static function getGroups(): array
    {
        return ['demo'];
    }

    public function getDependencies(): array
    {
        return [AppFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        $admin = $this->getReference(AppFixtures::ADMIN_REFERENCE, User::class);

        $user = new User();
        $user->setEmail('ewa.mazur@hr-portal.local');
        $user->setFirstName('Ewa');
        $user->setLastName('Mazur');
        $user->addRoleEntity($this->getReference(AppFixtures::USER_ROLE_REFERENCE, Role::class));
        $user->setPassword($this->passwordHasher->hashPassword($user, 'user12345'));
        $manager->persist($user);

        $companies = [];
        foreach (self::COMPANIES as [$name, $nip, $street, $city, $postalCode]) {
            $company = (new Company())
                ->setName($name)->setNip($nip)->setStreet($street)->setCity($city)->setPostalCode($postalCode);
            $manager->persist($company);
            $companies[] = $company;
        }

        $employees = [];
        foreach (self::EMPLOYEES as $i => [$firstName, $lastName, $pesel, $email, $companyIndex, $address]) {
            $employee = (new Employee())
                ->setFirstName($firstName)->setLastName($lastName)->setPesel($pesel)
                ->setPhone(sprintf('+48 5%d0 1%d2 3%d4', $i, $i, $i))
                ->setEmail($email)->setAddress($address)->setCompany($companies[$companyIndex])->setCreatedBy($admin);
            $manager->persist($employee);
            $employees[] = $employee;
        }

        foreach (self::REFERRALS as [$employeeIndex, $type, $job, $description, $factorName, $details, $issueDate, $place]) {
            $referral = (new Referral())
                ->setEmployee($employees[$employeeIndex])->setExaminationType($type)
                ->setJobPosition($job)->setJobDescription($description)
                ->setIssuePlace($place)->setIssueDate(new \DateTimeImmutable($issueDate))
                ->setCreatedBy($admin);

            $factors = [[$factorName, $details]];
            if (ExaminationType::Wstepne !== $type) {
                $factors[] = ['Praca zmianowa', 'System dwuzmianowy'];
            }
            foreach ($factors as [$name, $exposureDetails]) {
                $referral->addExposureFactor(
                    (new ReferralExposureFactor())
                        ->setFactor($this->getReference(AppFixtures::FACTOR_REFERENCE_PREFIX.$name, ExposureFactor::class))
                        ->setExposureDetails($exposureDetails),
                );
            }
            $manager->persist($referral);
        }

        $manager->flush();
    }
}
