import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import PlausibleProvider from "next-plausible";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Learn Ethereum by doing | Ethereum Learning Lab",
  description:
    "Interactive, browser-based labs to learn Ethereum, the EVM, and Solidity by doing. Go from the core ideas to deploying your own smart contract.",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <head>
        <PlausibleProvider src="https://plausible.io/js/pa-G-inyMLoFwlqhorT07uDn.js" />
      </head>
      <body>
        <ThemeProvider enableSystem defaultTheme="dark">
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
