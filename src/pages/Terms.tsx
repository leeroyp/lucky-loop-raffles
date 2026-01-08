import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";

export default function Terms() {
  return (
    <Layout>
      <SEO 
        title="Terms of Service" 
        description="Read the LuckyLoop Terms of Service to understand your rights and responsibilities when using our platform."
      />
      <div className="min-h-screen py-24 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container px-4 max-w-3xl">
          <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using LuckyLoop, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground">
                You must be at least 18 years old to use LuckyLoop. By using our service, you represent 
                and warrant that you meet this age requirement and are legally able to enter into this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground">
                To participate in raffles, you must create an account. You are responsible for maintaining 
                the confidentiality of your account credentials and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Raffle Participation</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All raffle draws are conducted using provably fair cryptographic methods.</li>
                <li>Entries are non-transferable and non-refundable.</li>
                <li>No Purchase Necessary (NPN) entries are available for each raffle.</li>
                <li>Winners are selected randomly and can be verified independently.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Subscriptions & Payments</h2>
              <p className="text-muted-foreground">
                Subscription fees are billed monthly. You may cancel at any time, and you will retain 
                access until the end of your current billing period. Unused entries do not roll over.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Prizes</h2>
              <p className="text-muted-foreground">
                Prize values are stated at the time of raffle creation. Winners are responsible for any 
                applicable taxes. Prizes must be claimed within 30 days of the draw.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Prohibited Conduct</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Creating multiple accounts to gain additional entries.</li>
                <li>Using automated systems or bots to enter raffles.</li>
                <li>Attempting to manipulate or interfere with raffle outcomes.</li>
                <li>Any fraudulent or illegal activity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                LuckyLoop is provided "as is" without warranties of any kind. We are not liable for 
                any indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms from time to time. Continued use of LuckyLoop after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms of Service, please contact us at support@luckyloop.app.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
