export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
          <p>
            When you create an account, we collect your name, email address, and role
            (admin or seller). Sales transactions record product details, quantities,
            prices, and payment methods for business record-keeping.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
          <p>
            We use your information to authenticate you, manage staff roles, record and
            report sales, track inventory, and generate business analytics. We do not
            sell or share your personal data with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Data Storage &amp; Security</h2>
          <p>
            Your data is stored securely in our database. We use industry-standard
            encryption for data in transit. Account authentication is handled by Clerk,
            a third-party identity provider, under their own security practices.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Data Retention</h2>
          <p>
            We retain your account data and transaction records as long as your account
            is active. Sales records are kept for business and tax compliance purposes.
            You may request deletion of your account by contacting the system owner.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Your Rights</h2>
          <p>
            You have the right to access, correct, or request deletion of your personal
            data. To exercise these rights, contact the system administrator.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Contact</h2>
          <p>
            For questions about this privacy policy, please contact the business owner
            or system administrator.
          </p>
        </section>
      </div>
    </div>
  )
}
