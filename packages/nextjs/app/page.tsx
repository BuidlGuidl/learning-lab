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

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const lpWrap = "w-full max-w-[1216px] mx-auto px-5 sm:px-8 min-[1100px]:px-12";
const lpSection = "py-[72px] min-[901px]:py-[92px]";
const lpHeading = "m-0 text-lp-text-primary font-black";
const lpH2 = `${lpHeading} text-[clamp(32px,3.6vw,46px)] leading-[1.06]`;
const lpLead = "max-w-[56ch] m-0 text-[19px] leading-[1.6] text-lp-text-secondary";
const lpEyebrow =
  "inline-flex items-center self-start gap-[7px] rounded-tags bg-lp-eyebrow-bg px-3 py-1.5 text-sm font-bold uppercase text-lp-accent";
const lpIconTile = "flex h-12 w-12 items-center justify-center rounded-icon-tile bg-lp-icon-tile text-lp-accent";

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
    <Link
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-buttons text-base leading-none no-underline transition-colors whitespace-nowrap max-sm:w-full max-sm:px-[18px]",
        variant === "primary" &&
          "border border-lp-btn-bg bg-lp-btn-bg px-6 py-[13px] font-bold text-pure-white hover:border-lp-btn-bg-hover hover:bg-lp-btn-bg-hover",
        variant === "ghost" &&
          "border border-lp-ghost-border bg-transparent px-5 py-3 text-lp-text-primary hover:border-lp-ghost-border-hover",
        size === "lg" && "px-7 py-[15px] text-[17px]",
        className,
      )}
      href={href}
    >
      {children}
      {icon && <ArrowRightIcon className="h-[18px] w-[18px]" />}
    </Link>
  );
};

const Eyebrow = ({ icon: Icon, children }: { icon?: ComponentType<IconProps>; children: ReactNode }) => (
  <span className={lpEyebrow}>
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

const FEATURE_TINT_BG: Record<FeatureCardProps["tint"], string> = {
  lavender: "bg-lp-feat-lavender",
  mint: "bg-lp-feat-mint",
  peach: "bg-lp-feat-peach",
  pink: "bg-lp-feat-pink",
};

const FeatureCard = ({ tint, icon: Icon, title, body }: FeatureCardProps) => (
  <article className={cn("flex flex-col gap-3.5 rounded-cards p-7 text-lp-text-primary", FEATURE_TINT_BG[tint])}>
    <div className={lpIconTile}>
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="m-0 text-xl font-bold leading-[1.2]">{title}</h3>
    <p className="m-0 text-[15px] leading-[1.55]">{body}</p>
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
  <span className="mt-1.5 inline-flex items-center gap-[5px] text-base font-bold text-lp-accent">
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
      <div
        className={cn(
          "relative flex h-[200px] items-center justify-center overflow-hidden",
          artFill ? "p-0 [&_img]:h-full [&_img]:w-full [&_img]:max-h-none [&_img]:object-cover" : "p-6",
          !artFill && "[&_img]:h-auto [&_img]:max-h-40 [&_img]:w-auto [&_img]:object-contain",
          artTint === "lavender" ? "bg-lavender" : "bg-pastel-mint",
        )}
      >
        {artFill ? (
          <Image src={imageSrc} alt={imageAlt} width={800} height={500} priority={false} />
        ) : (
          <Image src={imageSrc} alt={imageAlt} width={260} height={180} priority={false} />
        )}
        {comingSoon && (
          <span className="absolute top-3.5 right-3.5 rounded-tags border border-lp-border bg-lp-surface px-2.5 py-[5px] text-[11px] font-bold uppercase text-lp-text-secondary">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 px-7 pt-7 pb-8">
        <div className="flex flex-wrap gap-2">
          {meta.map((item, index) => (
            <span
              key={item}
              className={cn(
                "rounded-tags px-2.5 py-1 text-xs font-bold",
                mintMetaIndex === index ? "bg-lp-pill-mint-bg text-lp-positive" : "bg-lp-pill-bg text-lp-pill-fg",
              )}
            >
              {item}
            </span>
          ))}
        </div>
        <h3 className="m-0 text-[28px] font-black text-lp-text-primary">{title}</h3>
        <p className="m-0 text-base leading-[1.6] text-lp-text-secondary">{body}</p>
        {comingSoon ? (
          <span className="mt-1.5 inline-flex items-center gap-[5px] text-base font-bold text-lp-text-tertiary">
            {action}
          </span>
        ) : (
          <ArrowLink>{action}</ArrowLink>
        )}
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <div
        className="flex cursor-default flex-col overflow-hidden rounded-cards border border-lp-border bg-lp-surface no-underline [&_img]:opacity-70"
        aria-disabled
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      className="flex flex-col overflow-hidden rounded-cards border border-lp-border bg-lp-surface no-underline transition hover:-translate-y-0.5 hover:border-lp-accent"
      href={href}
    >
      {content}
    </Link>
  );
};

const Brand = () => (
  <Link
    href={MARKETING_ROUTES.home}
    className="inline-flex items-center gap-[9px] text-base font-black leading-none text-lp-text-primary no-underline"
  >
    <Image src="/eth-diamond-purple.svg" alt="" width={24} height={24} />
    <span>Learning Lab</span>
  </Link>
);

const LabShot = () => (
  <div
    className="overflow-hidden rounded-cards border border-lp-border bg-lp-surface shadow-labshot"
    aria-label="Learning Lab product preview"
  >
    <div className="flex items-center gap-2 border-b border-lp-border bg-lp-band px-3.5 py-[11px]">
      <span className="flex shrink-0 gap-1.5" aria-hidden>
        <i className="h-[11px] w-[11px] rounded-full bg-lp-shot-dots" />
        <i className="h-[11px] w-[11px] rounded-full bg-lp-shot-dots" />
        <i className="h-[11px] w-[11px] rounded-full bg-lp-shot-dots" />
      </span>
      <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-lp-border bg-lp-shot-url-bg px-3 py-1 font-mono text-xs text-lp-text-secondary">
        Learning Lab · ethereum-101 / your-first-contract
      </span>
    </div>
    <div className="grid min-h-80 grid-cols-[0.85fr_1.15fr] max-[900px]:grid-cols-1">
      <div className="flex flex-col gap-3 border-r border-lp-shot-divider bg-lp-surface px-6 py-[26px] max-[900px]:border-r-0 max-[900px]:border-b">
        <span className="inline-flex items-center self-start gap-1.5 rounded-[7px] bg-lp-eyebrow-bg px-[9px] py-1 text-[11px] font-bold uppercase text-lp-accent">
          <LightBulbIcon className="h-3 w-3" />
          Concept
        </span>
        <h4 className="mt-1 mb-0.5 text-[23px] font-black leading-[1.08] text-lp-text-primary">Storing a value</h4>
        <p className="m-0 text-[13.5px] leading-[1.55] text-lp-text-primary">
          A contract&apos;s state lives onchain. Give <span className="lp-inline-mono">CrowdFund</span> a public{" "}
          <span className="lp-inline-mono">goal</span> and the network remembers it forever.
        </p>
        <p className="m-0 text-[13.5px] leading-[1.55] text-lp-text-primary">
          Run it and watch the EVM commit your change.
        </p>
        <div className="mt-auto flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-buttons bg-lp-btn-bg px-4 py-[9px] text-[13px] font-bold text-pure-white">
            <PlayIcon className="h-[13px] w-[13px]" />
            Run
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-lp-positive">
            <CheckCircleIcon className="h-3.5 w-3.5" />1 / 1 passing
          </span>
        </div>
      </div>
      <div
        className="overflow-hidden bg-code-bg py-[18px] font-mono text-[10.5px] leading-[1.65] text-code-plain"
        aria-hidden
      >
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
          <div
            key={String(lineNumber)}
            className={cn(
              "flex whitespace-pre px-4",
              highlighted && "bg-lp-code-highlight-bg shadow-[inset_3px_0_0_var(--color-lilac)]",
            )}
          >
            <span className="w-5 shrink-0 pr-3.5 text-right text-code-comment">{lineNumber}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SocraticMock = () => (
  <div
    className="flex flex-col gap-3.5 rounded-cards border border-lp-border bg-lp-surface p-[22px] shadow-socratic"
    id="ai-tutor"
  >
    <div className="flex items-center gap-2.5 pb-1 max-sm:flex-wrap">
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-lp-eyebrow-bg text-lp-accent">
        <SparklesIcon className="h-[18px] w-[18px]" />
      </span>
      <b className="text-[15px] font-bold text-lp-text-primary">AI Tutor</b>
    </div>
    <div className="lp-bubble max-w-[88%] rounded-[14px] rounded-bl-buttons bg-lp-bubble-tutor px-[15px] py-3 text-[14.5px] leading-[1.55] text-lp-text-primary max-sm:max-w-full dark:border dark:border-dark-border-strong">
      Your <code>withdraw()</code> reverts. Before I help, what do you expect <code>balances[msg.sender]</code> to hold
      at this point?
    </div>
    <div className="lp-bubble self-end max-w-[88%] rounded-[14px] rounded-br-buttons border border-lp-bubble-you-border bg-lp-surface px-[15px] py-3 text-[14.5px] leading-[1.55] text-lp-text-primary max-sm:max-w-full">
      The full amount they contributed?
    </div>
    <div className="lp-bubble max-w-[88%] rounded-[14px] rounded-bl-buttons bg-lp-bubble-tutor px-[15px] py-3 text-[14.5px] leading-[1.55] text-lp-text-primary max-sm:max-w-full dark:border dark:border-dark-border-strong">
      Right. So if you send the ETH first and zero it out after, what could a malicious contract do in between?
    </div>
    <div className="mt-0.5 flex items-center gap-[7px] border-t border-dashed border-lp-border pt-3 text-[12.5px] text-lp-text-secondary">
      <MapIcon className="h-[15px] w-[15px] shrink-0 text-lp-accent" />
      Guiding you to discover reentrancy, not just patching it.
    </div>
  </div>
);

const Home: NextPage = () => {
  return (
    <div className={`lp ${inter.variable} ${ibmPlexMono.variable}`}>
      <nav
        className="flex h-[68px] items-center gap-10 border-b border-lp-border bg-lp-bg px-5 sm:px-8 min-[1100px]:px-12"
        aria-label="Main navigation"
      >
        <Brand />
        <div className="flex gap-6 max-[900px]:hidden">
          {PRODUCT_COPY.navLinks.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="text-base font-bold leading-none text-lp-text-primary transition-colors hover:text-lp-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <SwitchTheme className="ml-auto site-theme-switch" />
      </nav>

      <header
        className={`${lpWrap} grid grid-cols-[1fr_1.1fr] items-center gap-10 pt-14 pb-16 min-[1101px]:gap-24 min-[901px]:pt-[72px] min-[901px]:pb-[84px] max-[900px]:grid-cols-1`}
      >
        <div className="flex flex-col gap-5">
          <h1 className={`${lpHeading} text-[clamp(40px,4.4vw,58px)] leading-[1.02]`}>{PRODUCT_COPY.hero.title}</h1>
          <p className={lpLead}>{PRODUCT_COPY.hero.lead}</p>
          <div className="mt-1 flex flex-wrap gap-3 max-sm:flex-col">
            <MarketingButton href={MARKETING_ROUTES.ethereum101} size="lg" icon>
              Start Ethereum 101
            </MarketingButton>
            <MarketingButton href={MARKETING_ROUTES.howItWorks} variant="ghost" size="lg">
              See how it works
            </MarketingButton>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-4">
            {PRODUCT_COPY.hero.trust.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-lp-text-secondary"
              >
                <CheckIcon className="h-[15px] w-[15px] text-lp-positive" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <LabShot />
      </header>

      <section className={`${lpSection} bg-lp-band`} id="how-it-works">
        <div className={lpWrap}>
          <div className="grid grid-cols-2 items-center gap-10 min-[1101px]:gap-24 max-[900px]:grid-cols-1">
            <div className="flex flex-col gap-4">
              <Eyebrow>{PRODUCT_COPY.socratic.eyebrow}</Eyebrow>
              <h2 className={lpH2}>{PRODUCT_COPY.socratic.title}</h2>
              <p className={`${lpLead} text-lg`}>{PRODUCT_COPY.socratic.lead}</p>
              <ul className="mt-1.5 flex list-none flex-col gap-3 p-0">
                <li className="flex gap-2.5 text-base leading-normal text-lp-text-primary">
                  <ChatBubbleLeftRightIcon className="mt-0.5 h-5 w-5 shrink-0 text-lp-accent" />
                  Questions that build real intuition, not copy-paste habits
                </li>
                <li className="flex gap-2.5 text-base leading-normal text-lp-text-primary">
                  <RectangleStackIcon className="mt-0.5 h-5 w-5 shrink-0 text-lp-accent" />
                  Hints that go only as far as you actually need
                </li>
                <li className="flex gap-2.5 text-base leading-normal text-lp-text-primary">
                  <AcademicCapIcon className="mt-0.5 h-5 w-5 shrink-0 text-lp-accent" />
                  You finish knowing the <em>why</em> behind every line
                </li>
              </ul>
            </div>
            <SocraticMock />
          </div>
        </div>
      </section>

      <section className={`${lpSection} mx-auto w-full max-w-[1320px] px-5 sm:px-8 min-[1100px]:px-12`} id="evm">
        <div className="mb-8 flex max-w-none flex-col items-center gap-3.5 text-center min-[641px]:mb-12">
          <h2 className={lpH2}>{PRODUCT_COPY.capabilities.title}</h2>
          <p className={lpLead}>{PRODUCT_COPY.capabilities.lead}</p>
        </div>
        <div className="grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 min-[901px]:grid-cols-4">
          {featureCards.map(card => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className={`${lpSection} bg-lp-band-lav`} id="curriculum">
        <div className={lpWrap}>
          <div className="mb-8 flex max-w-none flex-col items-center gap-3.5 text-center min-[641px]:mb-12 [&_span]:self-center [&_span]:bg-lp-eyebrow-on-lav">
            <Eyebrow>{PRODUCT_COPY.curriculum.eyebrow}</Eyebrow>
            <h2 className={lpH2}>{PRODUCT_COPY.curriculum.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 min-[901px]:grid-cols-2">
            {curriculumModules.map(module => (
              <ModuleCard key={module.title} {...module} />
            ))}
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t border-lp-border bg-lp-bg px-5 py-7 sm:px-8 min-[1100px]:px-12 max-sm:flex-col max-sm:items-start">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-[9px] text-base font-black leading-none text-lp-text-primary">
            <Image src="/eth-diamond-purple.svg" alt="" width={22} height={22} />
            Learning Lab
          </span>
          <small className="max-w-[40ch] text-[13px] leading-normal text-lp-text-tertiary">
            Interactive Ethereum labs, concepts to code.
          </small>
        </div>
      </footer>
    </div>
  );
};

export default Home;
