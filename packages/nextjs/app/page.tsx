import type { ComponentType, ReactNode } from "react";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CheckIcon,
  CpuChipIcon,
  LightBulbIcon,
  MapIcon,
  PlayIcon,
  RectangleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lp-inter",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lp-mono",
});

const MARKETING_ROUTES = {
  home: "/",
  labs: "#curriculum",
  howItWorks: "#how-it-works",
  curriculum: "#curriculum",
  ethereum101: "/labs/ethereum-101",
  tokenization: "/labs/tokenization",
};

const PRODUCT_COPY = {
  navLinks: [
    { label: "How it works", href: MARKETING_ROUTES.howItWorks },
    { label: "Labs", href: MARKETING_ROUTES.labs },
  ],
  hero: {
    title: (
      <>
        Learn Ethereum.
        <br />
        Concepts first,
        <br />
        code when you&apos;re ready
      </>
    ),
    lead: (
      <>
        Guided labs take you from the basics to deploying your own contract: first the concepts in plain language, then
        real code you write and run in your browser, with an AI tutor asking the questions that make it click.
      </>
    ),
    trust: ["No experience needed", "Concepts, not just code", "Runs in your browser"],
  },
  socratic: {
    eyebrow: "The Socratic method",
    title: "We don't hand you the answer. We ask the right question.",
    lead: (
      <>
        Most tutorials let you copy, paste, and forget. We don&apos;t. Get stuck, and the AI tutor does what a great
        mentor does: asks the one question that gets you unstuck, so you reach the answer yourself. That&apos;s harder
        than being handed it, and it sticks. The closest thing to a private tutor, on every card.
      </>
    ),
  },
  capabilities: {
    title: "More than a coding course.",
    lead: "Every lab moves through plain-language concepts, Socratic questions, and hands-on code. Some cards never ask you to write a line. They make sure you understand what you're building first.",
  },
  curriculum: {
    eyebrow: "Curriculum",
    title: "Explore our labs, with more on the way.",
  },
};

const featureCards: FeatureCardProps[] = [
  {
    tint: "lavender",
    icon: LightBulbIcon,
    title: "Concepts, not just code",
    body: "Many cards are pure explanation, with visuals: the world computer, gas, reentrancy. You build the mental model before you write any Solidity.",
  },
  {
    tint: "pink",
    icon: AcademicCapIcon,
    title: "Start from zero",
    body: "Lessons hand-picked and ordered from first principles up. No crypto background required, nothing to install. Beginner-friendly by design.",
  },
  {
    tint: "mint",
    icon: CpuChipIcon,
    title: "Real code, real EVM",
    body: "When it's time to build, you write actual Solidity and run it against a live EVM: no testnet, no faucet, no setup.",
  },
  {
    tint: "peach",
    icon: BoltIcon,
    title: "Deploy and use it",
    body: "One click deploys your contract to the in-browser chain. Then read it back, call it, and try to break it. The same flow real builders use.",
  },
];

const curriculumModules: ModuleCardProps[] = [
  {
    href: MARKETING_ROUTES.ethereum101,
    artTint: "lavender",
    artFill: true,
    imageSrc: "/ethereum-101-learning-lab.png",
    imageAlt: "",
    meta: ["Beginner", "23 cards"],
    title: "Ethereum 101",
    body: (
      <>
        Go from &ldquo;what is Ethereum&rdquo; to deploying your own crowdfunding contract. Meet the world computer,
        accounts, and gas, then write, deploy, and use a real contract that collects contributions and refunds them if
        the goal falls short.
      </>
    ),
    action: "Start Ethereum 101",
  },
  {
    href: MARKETING_ROUTES.tokenization,
    artTint: "mint",
    imageSrc: "/feature-global.png",
    imageAlt: "",
    meta: ["Intermediate", "ERC-721 · NFTs"],
    mintMetaIndex: 0,
    comingSoon: true,
    title: "Tokenization",
    body: (
      <>
        How NFTs really work. Mint your own collection, transfer ownership, and handle approvals, then see what&apos;s
        happening onchain underneath.
      </>
    ),
    action: "Coming soon",
  },
];

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  icon?: boolean;
  className?: string;
};

const MarketingButton = ({ href, children, variant = "primary", size = "md", icon, className = "" }: ButtonProps) => {
  return (
    <Link className={`lp-btn lp-btn--${variant} ${size === "lg" ? "lp-btn--lg" : ""} ${className}`} href={href}>
      {children}
      {icon && <ArrowRightIcon className="h-[18px] w-[18px]" />}
    </Link>
  );
};

const Eyebrow = ({ icon: Icon, children }: { icon?: ComponentType<IconProps>; children: ReactNode }) => (
  <span className="lp-eyebrow">
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {children}
  </span>
);

type IconProps = {
  className?: string;
};

type FeatureCardProps = {
  tint: "lavender" | "mint" | "peach" | "pink";
  icon: ComponentType<IconProps>;
  title: string;
  body: string;
};

const FeatureCard = ({ tint, icon: Icon, title, body }: FeatureCardProps) => (
  <article className={`lp-feat-card lp-tint-${tint}`}>
    <div className="lp-feat-card__icon">
      <Icon className="h-6 w-6" />
    </div>
    <h3>{title}</h3>
    <p>{body}</p>
  </article>
);

type ModuleCardProps = {
  href: string;
  artTint: "lavender" | "mint";
  artFill?: boolean;
  imageSrc: string;
  imageAlt: string;
  meta: string[];
  mintMetaIndex?: number;
  title: string;
  body: ReactNode;
  action: string;
  comingSoon?: boolean;
};

const ArrowLink = ({ children }: { children: ReactNode }) => (
  <span className="lp-arrow-link">
    {children}
    <ArrowRightIcon className="h-4 w-4" />
  </span>
);

const ModuleCard = ({
  href,
  artTint,
  artFill,
  imageSrc,
  imageAlt,
  meta,
  mintMetaIndex,
  title,
  body,
  action,
  comingSoon,
}: ModuleCardProps) => {
  const content = (
    <>
      <div className={`lp-module-card__art lp-tint-${artTint} ${artFill ? "lp-module-card__art--fill" : ""}`}>
        {artFill ? (
          <Image src={imageSrc} alt={imageAlt} width={800} height={500} quality={95} priority={false} />
        ) : (
          <Image src={imageSrc} alt={imageAlt} width={260} height={180} priority={false} />
        )}
        {comingSoon && <span className="lp-module-card__badge">Coming soon</span>}
      </div>
      <div className="lp-module-card__body">
        <div className="lp-module-card__meta">
          {meta.map((item, index) => (
            <span key={item} className={`lp-pill ${mintMetaIndex === index ? "lp-pill--mint" : ""}`}>
              {item}
            </span>
          ))}
        </div>
        <h3>{title}</h3>
        <p>{body}</p>
        {comingSoon ? (
          <span className="lp-arrow-link lp-arrow-link--muted">{action}</span>
        ) : (
          <ArrowLink>{action}</ArrowLink>
        )}
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <div className="lp-module-card lp-module-card--soon" aria-disabled>
        {content}
      </div>
    );
  }

  return (
    <Link className="lp-module-card" href={href}>
      {content}
    </Link>
  );
};

const Brand = () => (
  <Link href={MARKETING_ROUTES.home} className="lp-brand">
    <Image src="/eth-diamond-purple.svg" alt="" width={24} height={24} />
    <span>Learning Lab</span>
  </Link>
);

const LabShot = () => (
  <div className="lp-labshot" aria-label="Learning Lab product preview">
    <div className="lp-labshot__bar">
      <span className="lp-labshot__dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="lp-labshot__url">Learning Lab · ethereum-101 / your-first-contract</span>
    </div>
    <div className="lp-labshot__body">
      <div className="lp-labshot__concept">
        <span className="lp-labshot__eyebrow">
          <LightBulbIcon className="h-3 w-3" />
          Concept
        </span>
        <h4>Storing a value</h4>
        <p>
          A contract&apos;s state lives onchain. Give <span className="lp-inline-mono">CrowdFund</span> a public{" "}
          <span className="lp-inline-mono">goal</span> and the network remembers it forever.
        </p>
        <p>Run it and watch the EVM commit your change.</p>
        <div className="lp-labshot__runrow">
          <span className="lp-labshot__run">
            <PlayIcon className="h-[13px] w-[13px]" />
            Run
          </span>
          <span className="lp-labshot__pass">
            <CheckCircleIcon className="h-3.5 w-3.5" />1 / 1 passing
          </span>
        </div>
      </div>
      <div className="lp-labshot__code" aria-hidden>
        {[
          [
            "1",
            <>
              <span className="lc-k">contract</span> <span className="lc-f">CrowdFund</span>{" "}
              <span className="lc-p">{"{"}</span>
            </>,
          ],
          [
            "2",
            <>
              {"  "}
              <span className="lc-t">uint256</span> <span className="lc-k">public</span>{" "}
              <span className="lc-k">constant</span> goal <span className="lc-p">=</span>{" "}
              <span className="lc-n">1 ether</span>
              <span className="lc-p">;</span>
            </>,
            true,
          ],
          [
            "3",
            <>
              {"  "}
              <span className="lc-t">uint256</span> <span className="lc-k">public</span> raised
              <span className="lc-p">;</span>
            </>,
          ],
          ["4", " "],
          [
            "5",
            <>
              {"  "}
              <span className="lc-k">function</span> <span className="lc-f">contribute</span>
              <span className="lc-p">()</span> <span className="lc-k">public</span>{" "}
              <span className="lc-k">payable</span> <span className="lc-p">{"{"}</span>
            </>,
          ],
          [
            "6",
            <>
              {"    "}raised <span className="lc-p">+=</span> <span className="lc-k">msg</span>.value
              <span className="lc-p">;</span>
            </>,
          ],
          [
            "7",
            <>
              {"  "}
              <span className="lc-p">{"}"}</span>
            </>,
          ],
          [
            "8",
            <>
              <span className="lc-p">{"}"}</span>
            </>,
          ],
        ].map(([lineNumber, line, highlighted]) => (
          <div key={String(lineNumber)} className={`lp-labshot__line ${highlighted ? "is-highlighted" : ""}`}>
            <span className="lp-labshot__gutter">{lineNumber}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SocraticMock = () => (
  <div className="lp-socratic" id="ai-tutor">
    <div className="lp-socratic__head">
      <span className="lp-socratic__avatar">
        <SparklesIcon className="h-[18px] w-[18px]" />
      </span>
      <b>AI Tutor</b>
    </div>
    <div className="lp-bubble lp-bubble--tutor">
      Your <code>withdraw()</code> reverts. Before I help, what do you expect <code>balances[msg.sender]</code> to hold
      at this point?
    </div>
    <div className="lp-bubble lp-bubble--you">The full amount they contributed?</div>
    <div className="lp-bubble lp-bubble--tutor">
      Right. So if you send the ETH first and zero it out after, what could a malicious contract do in between?
    </div>
    <div className="lp-socratic__caption">
      <MapIcon className="h-[15px] w-[15px]" />
      Guiding you to discover reentrancy, not just patching it.
    </div>
  </div>
);

const Home: NextPage = () => {
  return (
    <div className={`lp ${inter.variable} ${ibmPlexMono.variable}`}>
      <nav className="lp-nav" aria-label="Main navigation">
        <Brand />
        <div className="lp-nav__links">
          {PRODUCT_COPY.navLinks.map(link => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <SwitchTheme className="lp-nav__theme site-theme-switch" />
      </nav>

      <header className="lp-hero lp-wrap">
        <div className="lp-hero__text">
          <h1 className="lp-display">{PRODUCT_COPY.hero.title}</h1>
          <p className="lp-lead">{PRODUCT_COPY.hero.lead}</p>
          <div className="lp-hero__cta">
            <MarketingButton href={MARKETING_ROUTES.ethereum101} size="lg" icon>
              Start Ethereum 101
            </MarketingButton>
            <MarketingButton href={MARKETING_ROUTES.howItWorks} variant="ghost" size="lg">
              See how it works
            </MarketingButton>
          </div>
          <div className="lp-hero__trust">
            {PRODUCT_COPY.hero.trust.map(item => (
              <span key={item}>
                <CheckIcon className="h-[15px] w-[15px]" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <LabShot />
      </header>

      <section className="lp-section lp-band" id="how-it-works">
        <div className="lp-wrap">
          <div className="lp-featured">
            <div className="lp-featured__text">
              <Eyebrow>{PRODUCT_COPY.socratic.eyebrow}</Eyebrow>
              <h2 className="lp-h2">{PRODUCT_COPY.socratic.title}</h2>
              <p className="lp-lead">{PRODUCT_COPY.socratic.lead}</p>
              <ul className="lp-featured__list">
                <li>
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Questions that build real intuition, not copy-paste habits
                </li>
                <li>
                  <RectangleStackIcon className="h-5 w-5" />
                  Hints that go only as far as you actually need
                </li>
                <li>
                  <AcademicCapIcon className="h-5 w-5" />
                  You finish knowing the <em>why</em> behind every line
                </li>
              </ul>
            </div>
            <SocraticMock />
          </div>
        </div>
      </section>

      <section className="lp-section lp-wrap" id="evm">
        <div className="lp-section__head is-center">
          <h2 className="lp-h2">{PRODUCT_COPY.capabilities.title}</h2>
          <p className="lp-lead">{PRODUCT_COPY.capabilities.lead}</p>
        </div>
        <div className="lp-feat-grid">
          {featureCards.map(card => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="lp-section lp-band-lav" id="curriculum">
        <div className="lp-wrap">
          <div className="lp-section__head is-center">
            <Eyebrow>{PRODUCT_COPY.curriculum.eyebrow}</Eyebrow>
            <h2 className="lp-h2">{PRODUCT_COPY.curriculum.title}</h2>
          </div>
          <div className="lp-module-grid">
            {curriculumModules.map(module => (
              <ModuleCard key={module.title} {...module} />
            ))}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer__brand">
          <span className="lp-footer__brand-row">
            <Image src="/eth-diamond-purple.svg" alt="" width={22} height={22} />
            Learning Lab
          </span>
          <small>Interactive Ethereum labs, concepts to code.</small>
        </div>
      </footer>
    </div>
  );
};

export default Home;
