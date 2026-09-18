import { sepolia } from "viem/chains";
import { contracts } from "~~/utils/scaffold-eth/contract";

// Deliberately its own module, with no "use client": both a client component
// (SeasonPoll) and plain lab data (lab.ts, whose card copy quotes the address)
// need this value, and lab.ts is imported on the server by the grade route.
// Exporting a non-component value from a "use client" module hands that server
// import a client-reference proxy instead of a string, which throws the moment
// the card body interpolates it — a 500 the browser never sees, because the lab
// page loads the registry on the client.
export const POLL_ADDRESS = contracts?.[sepolia.id]?.SeasonPoll?.address;
