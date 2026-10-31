import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "../legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service · Bread",
  description: "The terms that apply when you use Bread.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern your use of the Bread mobile app and breadapp.fun (together,
        &ldquo;Bread&rdquo;). By creating an account or using Bread you agree to them. If you do
        not agree, do not use Bread.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old and legally able to enter into these terms. Bread is not
        available to residents of the United States or of any country where offering it would be
        unlawful, including countries subject to comprehensive sanctions. You are responsible for
        making sure your use of Bread is legal where you live.
      </p>

      <h2>Your wallet</h2>
      <p>
        Bread gives you a self-custodial Solana wallet powered by Privy. Bread never takes custody
        of your funds and cannot reverse, cancel, or refund a confirmed blockchain transaction.
        You are responsible for keeping access to the login you use with Bread. If you lose access
        to it, you may lose access to your wallet.
      </p>

      <h2>What Bread is, and is not</h2>
      <ul>
        <li>
          Bread is software that helps you find ideas and send trades to third-party protocols on
          the Solana blockchain, such as Jupiter and Phoenix. Bread is not a broker, exchange,
          bank, or investment adviser.
        </li>
        <li>
          Nothing in Bread, including Sandwiches, AI-generated summaries, other users&rsquo; posts,
          or notifications, is financial, investment, legal, or tax advice. Make your own
          decisions.
        </li>
        <li>
          Tokenized stocks available through Bread are tokens issued by third parties that track
          the price of a share. They are not the share itself, do not give you shareholder rights,
          and can trade at a different price from the underlying stock.
        </li>
        <li>
          Perpetual futures use leverage. You can lose more than you expect, and positions can be
          liquidated quickly.
        </li>
      </ul>

      <h2>Risk</h2>
      <p>
        Crypto assets and tokenized assets are volatile and can lose all of their value. Prices
        shown in Bread are estimates from third-party sources and may be delayed or wrong. Trades
        may fill at a different price, fail, or only partly complete, and a multi-asset Sandwich
        may buy some assets but not others. Third-party protocols, blockchains, and on-ramps can
        fail, be attacked, or change without notice. You accept these risks when you use Bread.
      </p>

      <h2>Fees</h2>
      <p>
        Bread may charge a fee on trades and withdrawals. Any fee is shown before you confirm.
        Network fees and third-party fees, such as on-ramp fees, may also apply.
      </p>

      <h2>Demo buys</h2>
      <p>
        Demo mode uses virtual money at live prices. Demo results are not real and do not predict
        real results.
      </p>

      <h2>Your content and conduct</h2>
      <p>
        You own what you post, and you give Bread a worldwide, royalty-free license to host,
        display, and share it within Bread and to promote Bread. You must not post content that is
        unlawful, fraudulent, hateful, harassing, sexually explicit, violent, or that infringes
        anyone&rsquo;s rights, and you must not manipulate markets, impersonate others, spam, or
        interfere with Bread.
      </p>
      <p>
        We have zero tolerance for objectionable content or abusive users. You can report content
        and block users in the app. We review reports, may remove content, and may suspend or ban
        accounts that break these rules.
      </p>

      <h2>Third-party services</h2>
      <p>
        Bread relies on services we do not control, including Privy, Apple, Google, Coinbase,
        MoonPay, Jupiter, Phoenix, and X. Their own terms apply to your use of them, and we are not
        responsible for them.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can delete your account at any time in Settings. Withdraw your funds first. We may
        suspend or end your access if you break these terms or if required by law.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Bread is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of
        any kind, to the fullest extent allowed by law.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent allowed by law, Bread is not liable for any indirect, incidental,
        special, or consequential damages, or for any loss of funds, profits, or data, arising from
        your use of Bread, third-party services, or blockchain networks. Our total liability for
        any claim is limited to the fees you paid to Bread in the 12 months before the claim.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. If the changes are material we will let you know in the app.
        Continuing to use Bread after that means you accept the updated terms.
      </p>

      <h2>Apple</h2>
      <p>
        These terms are between you and Bread, not Apple. Apple is not responsible for Bread or
        its content, has no obligation to provide support for it, and is a third-party beneficiary
        of these terms with the right to enforce them against you.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
