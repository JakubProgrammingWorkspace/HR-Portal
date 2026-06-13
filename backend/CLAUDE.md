# Backend notes

- PDF generation for referrals lives in `src/Service/ReferralPdfGeneratorService.php`
  (`generate(Referral $referral): string`). It renders `templates/referral_pdf.html.twig`
  via Twig and converts it to PDF with dompdf, writing to the directory configured by
  the `referral_pdf_dir` parameter (`config/services.yaml`, defaults to
  `%kernel.project_dir%/var/referrals`). It returns a path relative to the project root
  (`var/referrals/{id}.pdf`) - resolve against `kernel.project_dir` to get the absolute
  path for streaming/download.
- The service is declared `public: true` in `config/services.yaml` so it can be fetched
  directly from the container in tests/other services - keep that in mind if it's ever
  refactored to an interface.
- `POST /api/referrals/{id}/generate-pdf` (operation name `generate_pdf`, `read: true` +
  `input: false` + `ReferralGeneratePdfProcessor`) calls `ReferralService::generatePdf()`,
  which calls `ReferralPdfGeneratorService::generate()`, sets `pdfPath`/`pdfGeneratedAt`,
  flushes, and returns the updated `Referral` (status 200). Regenerating overwrites the
  file and updates `pdfGeneratedAt`.
- `GET /api/referrals/{id}/pdf` (operation name `download_pdf`, `read: false`, `output:
  false`, controller `App\Controller\ReferralPdfDownloadController`) streams the stored
  PDF via `BinaryFileResponse` (resolve `pdfPath` against `kernel.project_dir`), or 404 if
  `pdfPath` is null or the file is missing. Requires `symfony/mime` (installed) for
  `BinaryFileResponse`'s mime-type guessing.
- Any class referenced via API Platform's `controller:` attribute must be tagged
  `controller.service_arguments` in `config/services.yaml` (the routing loader's
  `$container->has($controller)` check otherwise fails with "defining an unknown
  service as controller").
- `var/referrals/` must be writable by the `www-data` user (php-fpm's runtime user, see
  `docker/php`) - if it gets chowned to the host uid (e.g. after a `chown -R 1000:1000
  /var/www/html` following a composer command), generate-pdf returns a 500 "Permission
  denied" from the live stack even though PHPUnit (run as root) still passes. Fix with
  `chmod 777 var/referrals` (mode 0775 created by `mkdir()` isn't enough since www-data
  is neither the owner nor in the owning group).
