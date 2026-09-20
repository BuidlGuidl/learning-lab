import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * SeasonPoll — a one-vote-per-address poll for a favorite season.
 * Deployed from the learning-lab-wallets-poll-contract repo.
 */
const externalContracts = {
  11155111: {
    SeasonPoll: {
      address: "0xd5aae9d887b4b1d6800371a7c2ce2970bef27748",
      abi: [
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "voter",
              type: "address",
            },
            {
              indexed: true,
              internalType: "enum SeasonPoll.Season",
              name: "season",
              type: "uint8",
            },
          ],
          name: "Voted",
          type: "event",
        },
        {
          inputs: [],
          name: "getResults",
          outputs: [
            {
              internalType: "uint256[4]",
              name: "counts",
              type: "uint256[4]",
            },
            {
              internalType: "uint256",
              name: "total",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "hasVoted",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "enum SeasonPoll.Season",
              name: "season",
              type: "uint8",
            },
          ],
          name: "vote",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "voter",
              type: "address",
            },
          ],
          name: "voteOf",
          outputs: [
            {
              internalType: "bool",
              name: "voted",
              type: "bool",
            },
            {
              internalType: "enum SeasonPoll.Season",
              name: "season",
              type: "uint8",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
