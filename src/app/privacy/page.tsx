import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "../legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy · Bread",
  description: "How Bread collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what information Bread (&ldquo;Bread&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects when you use the Bread mobile app and breadapp.fun, how we use
        it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> When you sign in with Apple or Google we receive
          your name and email address (or Apple&rsquo;s private relay address) and a user
          identifier. You choose a username, and you can add a profile photo and a short bio.
        </li>
        <li>
          <strong>Wallet and transaction information.</strong> Bread creates a self-custodial
          Solana wallet for you. We store your public wallet address and records of deposits,
          trades, and withdrawals made through the app. Blockchain transactions are public by
          nature and can be viewed by anyone.
        </li>
        <li>
          <strong>Content you create.</strong> Sandwiches, likes, follows, links you share into the
          app, and anything you post or report.
        </li>
        <li>
          <strong>Connected accounts.</strong> If you connect your X account, we receive your X
          username and the posts you like so the features you turn on can act on them.
        </li>
        <li>
          <strong>Device information.</strong> A push notification token, and basic device and app
          version details used to deliver notifications and fix bugs.
        </li>
        <li>
          <strong>Photos.</strong> Only the images you choose from your photo library, for your
          profile or a Sandwich cover. We do not access the rest of your library.
        </li>
      </ul>
      <p>
        We do not collect your precise location, contacts, or browsing history, and we do not track
        you across other companies&rsquo; apps or websites.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To create and secure your account and wallet.</li>
        <li>To quote, execute, and record the trades and transfers you request.</li>
        <li>To show your profile, holdings, and Sandwiches to you and, where public, to others.</li>
        <li>To send notifications you can control in Settings.</li>
        <li>To prevent fraud and abuse, enforce our Terms, and comply with law.</li>
        <li>To understand and improve the app.</li>
      </ul>
      <p>We do not sell your personal information and do not use it for third-party advertising.</p>

      <h2>Who we share it with</h2>
      <p>We share information only with service providers that help us run Bread, including:</p>
      <ul>
        <li>Privy, for sign-in and embedded wallet infrastructure.</li>
        <li>Apple and Google, for sign-in.</li>
        <li>
          Coinbase and MoonPay, when you choose to buy USDC with a card or Apple Pay. They collect
          payment details directly under their own privacy policies; Bread never sees your card
          number.
        </li>
        <li>
          Trading and data providers such as Jupiter, Phoenix, Relay, Helius, and tokens.xyz, which
          receive your public wallet address and transaction details to quote and execute trades.
        </li>
        <li>AI model providers, which process links and text you submit to build a Sandwich.</li>
        <li>Hosting, database, and push notification providers (such as Vercel and Expo).</li>
      </ul>
      <p>
        We may also disclose information if required by law, to protect the rights and safety of
        our users or others, or as part of a merger or acquisition.
      </p>

      <h2>Your profile is public</h2>
      <p>
        Your username, profile photo, bio, Sandwiches, and portfolio performance can be visible to
        other Bread users. You can hide position sizes in Settings.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We keep your information while your account is active. You can delete your account at any
        time in Settings &rarr; Delete account; we then delete or anonymize your personal
        information, except records we must keep for legal, security, or fraud-prevention reasons.
        Data already written to a public blockchain cannot be deleted by anyone. Withdraw any funds
        before deleting your account.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        You can update your profile, turn off notifications, and disconnect X at any time.
        Depending on where you live, you may have the right to access, correct, export, or delete
        your personal information, or to object to certain processing. Contact us to make a
        request.
      </p>

      <h2>Security</h2>
      <p>
        Your wallet&rsquo;s private keys are managed by Privy&rsquo;s secure infrastructure and are
        never stored by Bread. We use encryption in transit and access controls to protect your
        data, but no system is perfectly secure.
      </p>

      <h2>Children</h2>
      <p>
        Bread is for people 18 and older. We do not knowingly collect information from anyone
        under 18.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. If the changes are material we will let you know in the app
        before they take effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
