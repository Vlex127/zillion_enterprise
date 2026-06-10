export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Zillion Enterprise, you agree to be bound by these
            Terms of Service. If you do not agree, you may not use the system.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Description of Service</h2>
          <p>
            Zillion Enterprise is a point-of-sale and inventory management system for
            retail businesses. It allows admins to manage products, staff, and sales,
            and sellers to process transactions at the counter.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account
            credentials. All activities under your account are your responsibility.
            Admins may create, modify, or deactivate staff accounts at their discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Acceptable Use</h2>
          <p>
            You agree to use the system only for legitimate business purposes. You may
            not use the system to record false transactions, manipulate inventory data,
            or interfere with other users&apos; access.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Limitation of Liability</h2>
          <p>
            Zillion Enterprise is provided &quot;as is&quot; without warranty of any
            kind. The business owner is not liable for any damages arising from the use
            or inability to use the system, including data loss or financial discrepancies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the
            system after changes constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  )
}
