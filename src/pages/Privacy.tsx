import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";

export default function Privacy() {
  return (
    <Layout>
      <SEO 
        title="Privacy Policy" 
        description="Learn how LuckyLoop collects, uses, and protects your personal information."
      />
      <div className="min-h-screen py-24 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container px-4 max-w-3xl">
          <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Account information (name, email address)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Raffle entry history</li>
                <li>Communications with us</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>To provide and maintain our service</li>
                <li>To process your raffle entries and subscriptions</li>
                <li>To notify winners and deliver prizes</li>
                <li>To send important updates about your account</li>
                <li>To improve our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Service providers who assist in our operations</li>
                <li>Payment processors (Stripe) for secure transactions</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information. 
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to maintain your session, remember preferences, 
                and analyze how our service is used. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground">
                Depending on your location, you may have rights to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
              <p className="text-muted-foreground">
                LuckyLoop is not intended for users under 18. We do not knowingly collect information 
                from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of significant 
                changes by email or through our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or your data, please contact us at 
                privacy@luckyloop.app.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
