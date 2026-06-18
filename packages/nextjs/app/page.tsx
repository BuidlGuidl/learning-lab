import type { ComponentType, ReactNode } from "react";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  CpuChipIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { HeroShowcase } from "~~/app/_components/HeroShowcase";
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
  labs: "#labs",
  howItWorks: "#how-it-works",
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
  capabilities: {
    title: "More than a coding course.",
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
        Learn how Ethereum can track who owns a unique item. Create an ERC-721 token, send it to another account, and
        control who else is allowed to move it.
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

      <header className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 min-[1100px]:px-12 grid grid-cols-[1fr_1.2fr] items-center gap-10 pt-14 pb-16 min-[1101px]:gap-24 min-[901px]:pt-[72px] min-[901px]:pb-[84px] max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-5">
          <h1 className={`${lpHeading} text-[clamp(40px,4.4vw,58px)] leading-[1.02]`}>{PRODUCT_COPY.hero.title}</h1>
          <p className={lpLead}>{PRODUCT_COPY.hero.lead}</p>
          <div className="mt-1 flex flex-wrap gap-3 max-sm:flex-col">
            <MarketingButton href={MARKETING_ROUTES.ethereum101} size="lg" icon>
              Start Ethereum 101
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
        <HeroShowcase />
      </header>

      <section className={`${lpSection} bg-lp-band`} id="how-it-works">
        <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-8 min-[1100px]:px-12">
          <div className="mb-8 flex max-w-none flex-col items-center gap-3.5 text-center min-[641px]:mb-12">
            <h2 className={lpH2}>{PRODUCT_COPY.capabilities.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 min-[901px]:grid-cols-4">
            {featureCards.map(card => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${lpSection} bg-lp-band-lav`} id="labs">
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
