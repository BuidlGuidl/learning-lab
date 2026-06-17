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
  CursorArrowRaysIcon,
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
  allCurriculum: "#curriculum",
  docs: "#docs",
  community: "#community",
  github: "#github",
};

const PRODUCT_COPY = {
  navLinks: [
    { label: "Labs", href: MARKETING_ROUTES.labs },
    { label: "How it works", href: MARKETING_ROUTES.howItWorks },
    { label: "Curriculum", href: MARKETING_ROUTES.curriculum },
  ],
  hero: {
    eyebrow: "Learn Ethereum in the browser",
    title: "Build on Ethereum without installing a thing.",
    lead: (
      <>
        Learning Lab runs a real EVM right in your browser. Write Solidity, deploy contracts, and break things &mdash;
        guided by an AI tutor that asks the right questions instead of handing you the answer.
      </>
    ),
    trust: ["Zero setup", "Real in-browser EVM", "AI tutor on every card"],
  },
  socratic: {
    eyebrow: "The Socratic method",
    title: "We don't hand you the answer. We ask the right question.",
    lead: (
      <>
        Most tutorials let you copy, paste, and forget. Learning Lab guides you to the solution yourself &mdash; so the
        understanding actually sticks. Get stuck, and the AI tutor responds the way a great mentor would: with the one
        question that unlocks your next step.
      </>
    ),
  },
  capabilities: {
    eyebrow: "Everything in the browser",
    title: "A complete lab in a single tab.",
    lead: "No Node, no Hardhat, no version conflicts. Open a tab and you're building.",
  },
  curriculum: {
    eyebrow: "Curriculum",
    title: "Two labs. Open one and start now.",
  },
};

const featureCards: FeatureCardProps[] = [
  {
    tint: "lavender",
    icon: CpuChipIcon,
    title: "In-browser EVM",
    body: "Deploy and call real contracts against a live EVM -- no testnet, no faucet, no wallet juggling.",
  },
  {
    tint: "mint",
    icon: CursorArrowRaysIcon,
    title: "Zero local setup",
    body: "Nothing to install or configure. Your environment is ready the moment the page loads.",
  },
  {
    tint: "peach",
    icon: CheckCircleIcon,
    title: "Instant validation",
    body: "Every exercise checks your work the moment you run it, and points you straight at the fix.",
  },
  {
    tint: "pink",
    icon: SparklesIcon,
    title: "AI tutor",
    body: "A Socratic companion that debugs with you and deepens the concept -- on every single card.",
  },
];

const curriculumModules: ModuleCardProps[] = [
  {
    href: MARKETING_ROUTES.ethereum101,
    artTint: "lavender",
    artFill: true,
    imageSrc: "/get-started-learn.png",
    imageAlt: "",
    meta: ["Beginner", "35 cards"],
    title: "Ethereum 101",
    body: (
      <>
        Accounts, transactions, gas, and your first smart contract &mdash; the foundation every onchain builder needs.
      </>
    ),
    action: "Start Ethereum 101",
  },
  {
    href: MARKETING_ROUTES.tokenization,
    artTint: "mint",
    imageSrc: "/feature-global.png",
    imageAlt: "",
    meta: ["Intermediate", "ERC-20 · ERC-721"],
    mintMetaIndex: 0,
    title: "Tokenization",
    body: (
      <>
        The patterns behind every token on Ethereum. Build ERC-20s and NFTs from scratch and see what&apos;s really
        happening underneath.
      </>
    ),
    action: "Start Tokenization",
  },
];

const footerColumns = [
  {
    title: "Labs",
    links: [
      { label: "Ethereum 101", href: MARKETING_ROUTES.ethereum101 },
      { label: "Tokenization", href: MARKETING_ROUTES.tokenization },
      { label: "All curriculum", href: MARKETING_ROUTES.allCurriculum },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "How it works", href: MARKETING_ROUTES.howItWorks },
      { label: "In-browser EVM", href: "#evm" },
      { label: "AI tutor", href: "#ai-tutor" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: MARKETING_ROUTES.docs },
      { label: "Community", href: MARKETING_ROUTES.community },
      { label: "GitHub", href: MARKETING_ROUTES.github },
    ],
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
}: ModuleCardProps) => (
  <Link className="lp-module-card" href={href}>
    <div className={`lp-module-card__art lp-tint-${artTint} ${artFill ? "lp-module-card__art--fill" : ""}`}>
      {artFill ? (
        <Image src={imageSrc} alt={imageAlt} width={800} height={500} quality={95} priority={false} />
      ) : (
        <Image src={imageSrc} alt={imageAlt} width={260} height={180} priority={false} />
      )}
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
      <ArrowLink>{action}</ArrowLink>
    </div>
  </Link>
);

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
      <span className="lp-labshot__url">learninglab.eth · ethereum-101 / your-first-contract</span>
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
          <span className="lp-inline-mono">threshold</span> and the network remembers it forever.
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
              <span className="lc-k">constant</span> threshold
            </>,
            true,
          ],
          [
            "3",
            <>
              {"    "}
              <span className="lc-p">=</span> <span className="lc-n">1 ether</span>
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
              {"    "}balances<span className="lc-p">[</span>
              <span className="lc-k">msg</span>.sender<span className="lc-p">]</span> <span className="lc-p">+=</span>{" "}
              <span className="lc-k">msg</span>.value
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
      <span className="lp-socratic__mode">Socratic mode</span>
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
      Guiding you to discover reentrancy &mdash; not just patching it.
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
          <Eyebrow icon={BoltIcon}>{PRODUCT_COPY.hero.eyebrow}</Eyebrow>
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
                  Prompts that build intuition, not copy-paste muscle memory
                </li>
                <li>
                  <RectangleStackIcon className="h-5 w-5" />
                  Hints that escalate only as far as you actually need
                </li>
                <li>
                  <AcademicCapIcon className="h-5 w-5" />
                  You leave understanding the <em>why</em> behind every line
                </li>
              </ul>
            </div>
            <SocraticMock />
          </div>
        </div>
      </section>

      <section className="lp-section lp-wrap" id="evm">
        <div className="lp-section__head is-center">
          <Eyebrow>{PRODUCT_COPY.capabilities.eyebrow}</Eyebrow>
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
          <small>Learn Ethereum by building &mdash; a real EVM and an AI tutor, right in your browser.</small>
        </div>
        {footerColumns.map(column => (
          <div key={column.title} className="lp-footer__col">
            <h5>{column.title}</h5>
            {column.links.map(link => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </footer>
    </div>
  );
};

export default Home;
