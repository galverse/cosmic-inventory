import { createPublicClient, http } from "viem";
import getViemNetwork from "../utils/getViemNetwork";

const providerEndpoint = process.env.NEXT_PUBLIC_PROVIDER_ENDPOINT || "";

// viem's built-in mainnet RPC (cloudflare-eth.com) was shut down and now fails every call,
// so mainnet always gets an explicit endpoint: ours if set, else a public one.
const fallbackRpcUrls: { [chainId: number]: string } = {
  1: "https://ethereum-rpc.publicnode.com",
};

export const rpcUrlFor = (chainId: number) =>
  chainId === 1 && providerEndpoint ? providerEndpoint : fallbackRpcUrls[chainId];

export const getPublicClient = (chainId: number) => {
  const chain = getViemNetwork(chainId);
  const publicClient = createPublicClient({
    chain: chain,
    transport: http(rpcUrlFor(chainId)),
  });
  return publicClient;
};

export const publicClient = getPublicClient(1);

export const rpcClient = publicClient;
