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
- US-024's generate-pdf endpoint should call `generate()`, then set
  `Referral::setPdfPath()` (store the returned relative path) and
  `setPdfGeneratedAt(new \DateTimeImmutable())` on the entity and flush - regenerating
  just calls `generate()` again (it overwrites the file at the same path) and updates
  `pdfGeneratedAt`.
