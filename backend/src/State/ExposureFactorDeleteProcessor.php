<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ExposureFactor;
use App\Service\ExposureFactorService;

/**
 * @implements ProcessorInterface<ExposureFactor, void>
 */
class ExposureFactorDeleteProcessor implements ProcessorInterface
{
    public function __construct(private readonly ExposureFactorService $exposureFactorService)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $this->exposureFactorService->deleteFactor($data);
    }
}
