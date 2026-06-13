<?php

namespace App\Service;

use App\Entity\Referral;
use App\Repository\ExposureCategoryRepository;
use Dompdf\Dompdf;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Environment;

class ReferralPdfGeneratorService
{
    public function __construct(
        private readonly Environment $twig,
        private readonly ExposureCategoryRepository $exposureCategoryRepository,
        #[Autowire(param: 'referral_pdf_dir')]
        private readonly string $storageDir,
    ) {
    }

    /**
     * Renders the Referral as a PDF and writes it to the storage directory,
     * returning the path relative to the project root.
     */
    public function generate(Referral $referral): string
    {
        $factorsByCategory = [];
        foreach ($referral->getExposureFactors() as $exposureFactor) {
            $categoryId = $exposureFactor->getFactor()->getCategory()->getId();
            $factorsByCategory[$categoryId][] = [
                'name' => $exposureFactor->getFactor()->getName(),
                'exposureDetails' => $exposureFactor->getExposureDetails(),
            ];
        }

        $categories = array_map(
            static fn ($category): array => [
                'code' => $category->getCode(),
                'name' => $category->getName(),
                'factors' => $factorsByCategory[$category->getId()] ?? [],
            ],
            $this->exposureCategoryRepository->findBy([], ['sortOrder' => 'ASC']),
        );

        $employee = $referral->getEmployee();

        $html = $this->twig->render('referral_pdf.html.twig', [
            'referral' => $referral,
            'employee' => $employee,
            'company' => $employee->getCompany(),
            'examinationTypeLabel' => $referral->getExaminationType()->label(),
            'categories' => $categories,
            'totalFactors' => $referral->getExposureFactors()->count(),
        ]);

        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        if (!is_dir($this->storageDir) && !mkdir($this->storageDir, 0775, true) && !is_dir($this->storageDir)) {
            throw new \RuntimeException(sprintf('Nie można utworzyć katalogu "%s".', $this->storageDir));
        }

        $relativePath = sprintf('var/referrals/%d.pdf', $referral->getId());
        file_put_contents(sprintf('%s/%d.pdf', $this->storageDir, $referral->getId()), $dompdf->output());

        return $relativePath;
    }
}
