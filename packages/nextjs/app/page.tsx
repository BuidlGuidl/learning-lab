import type { ComponentType, ReactNode } from "react";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRightIcon, CheckIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeroShowcase } from "~~/app/_components/HeroShowcase";
import { HeaderAuth } from "~~/components/HeaderAuth";
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
  ethereum101: "/labs/ethereum-101",
  wallets: "/labs/wallets",
  crowdfunding: "/labs/crowdfunding",
  speedrunEthereum: "https://speedrunethereum.com",
  buidlGuidl: "https://buidlguidl.com",
};

const PRODUCT_COPY = {
  hero: {
    title: (
      <>
        Learn Ethereum
        <br />
        by doing.
      </>
    ),
    lead: (
      <>
        Interactive, browser-based labs to learn Ethereum, the EVM, and Solidity by doing. You build real contracts,
        compile, deploy, and wire them with an UI.
      </>
    ),
    trust: ["No experience needed", "Runs in your browser"],
  },
  curriculum: {
    eyebrow: "Curriculum",
    title: "Explore our labs",
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
const curriculumModules: ModuleCardProps[] = [
  {
    href: MARKETING_ROUTES.ethereum101,
    artTint: "lavender",
    artFill: true,
    imageSrc: "/ethereum-101-learning-lab.png",
    imageAlt: "",
    level: "Beginner",
    activity: "Concepts",
    title: "Ethereum 101",
    body: (
      <>
        Meet the world computer. Learn what Ethereum is, what people build with it, and how it works. Explore wallets,
        smart contracts, and transactions through interactive examples. No coding needed.
      </>
    ),
    action: "Start Ethereum 101",
  },
  {
    href: MARKETING_ROUTES.wallets,
    artTint: "mint",
    artFill: true,
    imageSrc: "/wallets-final.webp",
    imageAlt: "",
    level: "Beginner",
    activity: "Transactions",
    title: "Wallets",
    body: (
      <>
        Set up a wallet, protect your recovery phrase, and get test ETH. Send a transaction, check it on a block
        explorer, and use your wallet to interact with an app.
      </>
    ),
    action: "Start Wallets",
  },
  {
    href: MARKETING_ROUTES.crowdfunding,
    artTint: "lavender",
    artFill: true,
    imageSrc: "/crowdfunding-final.webp",
    imageAlt: "",
    level: "Beginner",
    activity: "Solidity coding",
    title: "Crowdfunding Contract",
    body: (
      <>
        Build your own crowdfunding contract in Solidity. Write the rules, deploy it in your browser, and collect
        contributions. Test what happens when the goal is reached and how refunds work when it is not.
      </>
    ),
    action: "Start Crowdfunding Contract",
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

type ModuleCardProps = {
  href: string;
  artTint: "lavender" | "mint";
  artFill?: boolean;
  imageSrc: string;
  imageAlt: string;
  level: string;
  activity: string;
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
  level,
  activity,
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
          <span className="rounded-tags bg-lp-pill-bg px-2.5 py-1 text-xs font-bold text-lp-pill-fg">{level}</span>
          <span className="rounded-tags bg-lp-pill-bg px-2.5 py-1 text-xs font-bold text-lp-pill-fg">{activity}</span>
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
        className="flex h-[68px] items-center gap-3 border-b border-lp-border bg-lp-bg px-5 sm:px-8 min-[1100px]:px-12"
        aria-label="Main navigation"
      >
        <Brand />
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <HeaderAuth />
          <SwitchTheme className="site-theme-switch" />
        </div>
      </nav>

      <header className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 min-[1100px]:px-12 grid grid-cols-[1fr_1.2fr] items-center gap-10 pt-14 pb-16 min-[1101px]:gap-24 min-[901px]:pt-[72px] min-[901px]:pb-[84px] max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-5">
          <h1 className={`${lpHeading} text-[clamp(40px,4.4vw,58px)] leading-[1.02]`}>{PRODUCT_COPY.hero.title}</h1>
          <p className={lpLead}>{PRODUCT_COPY.hero.lead}</p>
          <div className="mt-1 flex flex-wrap gap-3 max-sm:flex-col">
            <MarketingButton href={MARKETING_ROUTES.ethereum101} size="lg">
              <span className="flex flex-col items-start gap-1">
                <span className="text-[13px] font-bold leading-none text-pure-white/70">Start the lab</span>
                <span className="flex items-center gap-2 text-xl font-black leading-none tracking-tight">
                  Ethereum 101
                  <ArrowRightIcon className="h-5 w-5" />
                </span>
              </span>
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

      <section className={`${lpSection} bg-lp-band-lav`} id="labs">
        <div className={lpWrap}>
          <div className="mb-8 flex max-w-none flex-col items-center gap-3.5 text-center min-[641px]:mb-12 [&_span]:self-center [&_span]:bg-lp-eyebrow-on-lav">
            <Eyebrow>{PRODUCT_COPY.curriculum.eyebrow}</Eyebrow>
            <h2 className={lpH2}>{PRODUCT_COPY.curriculum.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 min-[901px]:grid-cols-3">
            {curriculumModules.map(module => (
              <ModuleCard key={module.title} {...module} />
            ))}
          </div>
          <aside
            aria-labelledby="continue-learning-title"
            className="card relative isolate mt-10 min-h-[520px] overflow-hidden rounded-t-cards rounded-b-none bg-lavender sm:min-h-[400px] dark:bg-dark-surface"
          >
            {/* Original artwork: ethereum/ethereum-org-website, PR #12891. */}
            <Image
              src="/speedrun-ethereum-banner.png"
              alt=""
              fill
              sizes="(max-width: 639px) 1600px, 1280px"
              className="object-cover object-[35%_bottom] sm:object-center dark:brightness-60 dark:contrast-125 dark:saturate-150 dark:mask-[linear-gradient(to_bottom,black_90%,transparent_100%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-b from-lavender/90 via-lavender/30 to-transparent dark:from-dark-surface/95 dark:via-dark-surface/70 dark:to-dark-surface/20"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 bottom-6 z-10 rounded-t-cards border-x border-t border-lp-border"
            />
            <div className="relative flex max-w-[600px] flex-col items-start gap-4 px-6 pt-7 pb-36 sm:px-10 sm:pt-10">
              <h3
                id="continue-learning-title"
                className="m-0 text-[28px] leading-tight font-black text-onyx sm:text-[32px] dark:text-dark-text"
              >
                Continue learning with Speedrun Ethereum
              </h3>
              <p className="m-0 text-base leading-[1.6] text-onyx dark:text-dark-text">
                Finished the labs? Keep learning Solidity by building Ethereum apps. Follow hands-on challenges to write
                and deploy your own smart contracts, from tokenization to prediction markets.
              </p>
              <MarketingButton href={MARKETING_ROUTES.speedrunEthereum} icon className="mt-2">
                Start Speedrun Ethereum
              </MarketingButton>
            </div>
          </aside>
        </div>
      </section>

      <footer className="flex items-center justify-center gap-4 border-t border-lp-border bg-lp-bg px-5 py-7 sm:gap-8 sm:px-8 min-[1100px]:px-12">
        <div className="flex flex-col items-start gap-2 text-left">
          <span className="inline-flex items-center gap-[9px] text-base font-black leading-none text-lp-text-primary">
            <Image src="/eth-diamond-purple.svg" alt="" width={22} height={22} />
            Learning Lab
          </span>
          <small className="max-w-[40ch] text-[13px] leading-normal text-lp-text-tertiary">
            Interactive Ethereum labs, concepts to code.
          </small>
        </div>
        <div aria-hidden="true" className="w-px shrink-0 self-stretch bg-lp-border" />
        <p className="m-0 text-center text-sm text-lp-text-secondary">
          Built with <HeartIcon aria-hidden="true" className="inline-block h-4 w-4 align-text-bottom" />
          <span className="sr-only">love</span> by{" "}
          <a
            href={MARKETING_ROUTES.buidlGuidl}
            className="font-bold text-lp-accent hover:underline focus-visible:underline"
          >
            BuidlGuidl
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Home;
