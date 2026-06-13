<?php

namespace App\Controller;

use App\Repository\ReferralRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ReferralPdfDownloadController
{
    public function __construct(
        private readonly ReferralRepository $referralRepository,
        #[Autowire(param: 'kernel.project_dir')]
        private readonly string $projectDir,
    ) {
    }

    public function __invoke(int $id): BinaryFileResponse
    {
        $referral = $this->referralRepository->find($id);

        if (null === $referral || null === $referral->getPdfPath()) {
            throw new NotFoundHttpException('Plik PDF nie został wygenerowany dla tego skierowania.');
        }

        $absolutePath = $this->projectDir.'/'.$referral->getPdfPath();

        if (!is_file($absolutePath)) {
            throw new NotFoundHttpException('Plik PDF nie został wygenerowany dla tego skierowania.');
        }

        return new BinaryFileResponse($absolutePath);
    }
}
