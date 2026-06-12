<?php

namespace App\State;

use ApiPlatform\Metadata\IriConverterInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\ExposureFactorInput;
use App\Entity\ExposureCategory;
use App\Entity\ExposureFactor;
use App\Service\ExposureFactorService;

/**
 * @implements ProcessorInterface<ExposureFactorInput, ExposureFactor>
 */
class ExposureFactorCreateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ExposureFactorService $exposureFactorService,
        private readonly IriConverterInterface $iriConverter,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ExposureFactor
    {
        $category = $this->iriConverter->getResourceFromIri($data->category);
        \assert($category instanceof ExposureCategory);

        return $this->exposureFactorService->createFactor($data, $category);
    }
}
