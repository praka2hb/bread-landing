/**
 * The Stocklana pitch, one section per slide. `[click]` marks a slide build.
 * `secs` is the target time for the section.
 */
export type Section = { n: number; title: string; secs: number; text: string };

export const SCRIPT: Section[] = [
  {
    n: 1,
    title: "cover",
    secs: 6,
    text: "hey, i'm vighnesh, and i'm building bread: a social trading app for financial markets.",
  },
  {
    n: 2,
    title: "borrowed ideas",
    secs: 11,
    text: "people are shit at crafting ideas.\n\nthink about your last trade. you probably got the idea from somewhere: a youtube video, an x thread, a substack post. most financial ideas are borrowed.",
  },
  {
    n: 3,
    title: "ideas everywhere",
    secs: 15,
    text: "they're everywhere in your feed, but there's no easy way to trade them. [click] on bread, i share a video, like a post or reply under a tweet, and each one becomes a trade in my feed.",
  },
  {
    n: 4,
    title: "intro",
    secs: 11,
    text: "so that's bread: a social network where every idea is tradable. follow people, see what they're backing, and buy, long or short it in one tap.",
  },
  {
    n: 5,
    title: "mobile",
    secs: 12,
    text: "it's mobile-first. no desk, no ten tabs. bread pings you when something big moves, when your positions move, and when your people trade. live on testflight today.",
  },
  {
    n: 6,
    title: "like2buy",
    secs: 12,
    text: "like2buy. connect x once, then like a post with a market idea and bread buys the idea behind it.\n\nthe like on twitter itself becomes the trade.",
  },
  {
    n: 7,
    title: "creators",
    secs: 14,
    text: "every trade starts with someone's idea. [click] bread maps it and creates a shadow account for the source, [click] and every trade pays them a creator fee, even before they join. that's rolling out next.",
  },
  {
    n: 8,
    title: "flywheel",
    secs: 18,
    text: "bread doesn't need to bootstrap the social graph from zero. we inherit an existing financial graph from all over the internet, then convert that borrowed distribution into native liquidity, reputation, and retention.\n\nas the best traders build reputation, more users follow and learn from them. those users eventually form their own theses and become contributors in the network too.\n\nthis creates a compounding network effect. better traders increase idea quality, which attracts more users, and some of those users eventually become contributors themselves.",
  },
  {
    n: 9,
    title: "why now",
    secs: 15,
    text: "why now? memecoin social trading burns its users: only 6% of fomo wallets were in profit over 90 days.\n\nthis feels invisible in a bull market.\n\nbut as tokenization of assets increases, there are majority of markets that were gatekept to the globe. stocks and perps aren't zero-sum like that. and tokenized stocks went from $32m to $3.1b this year.",
  },
  {
    n: 10,
    title: "market",
    secs: 14,
    text: "we start with the 4m people already holding stocks onchain, then the social-first generation, where 48% of gen z learn investing on social, then the 560m+ crypto traders locked out of us stocks.",
  },
  {
    n: 11,
    title: "join",
    secs: 6,
    text: "bread is live on testflight. scan the code, and follow @breadappfun on x. thank you.",
  },
];

export const TOTAL_SECS = SCRIPT.reduce((a, s) => a + s.secs, 0);
