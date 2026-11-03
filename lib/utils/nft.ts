import { NftOrdering } from "alchemy-sdk";
import * as Sentry from "@sentry/nextjs";
import { MAX_TOKEN_ID, nftUrl } from "@/lib/constants";
import { alchemyLens, getAlchemy } from "@/lib/clients";

export async function getNfts(chainId: number, account: string) {
  try {
    const alchemy = getAlchemy(chainId);
    const response = await alchemy.nft.getNftsForOwner(account, {
      orderBy: NftOrdering.TRANSFERTIME,
    });
    if (!response.ownedNfts) {
      return [];
    }

    return response.ownedNfts.reverse();
  } catch (err) {
    console.error(err);
    Sentry.captureMessage(`getNfts error`, {
      tags: {
        reason: "nfts",
      },
      extra: {
        prepareError: err,
      },
    });
    return [];
  }
}

export async function getLensNfts(account: string) {
  try {
    const response = await alchemyLens.nft.getNftsForOwner(account, {
      orderBy: NftOrdering.TRANSFERTIME,
    });

    if (!response.ownedNfts) {
      return [];
    }

    const filteredLensHandles = response.ownedNfts.filter(
      (token) => token.contract.address == "0xdb46d1dc155634fbc732f92e853b10b288ad5a1d"
    );

    return filteredLensHandles.reverse();
  } catch (err) {
    console.error(err);
    Sentry.captureMessage(`getNfts error`, {
      tags: {
        reason: "nfts",
      },
      extra: {
        prepareError: err,
      },
    });
    return [];
  }
}

type TokenId = number & { __tokenIdBrand: never };

function isTokenId(value: number): value is TokenId {
  return value >= 0 && value <= MAX_TOKEN_ID;
}

export async function getNftAsset(
  tokenId: number,
  apiEndpoint?: string
): Promise<string[] | string> {
  if (isTokenId(tokenId)) {
    const assetUrl = `${apiEndpoint || nftUrl}/${tokenId}`;
    let response: Response;
    try {
      response = await fetch(assetUrl);
    } catch {
      // OpenSea embeds this page in a sandboxed iframe (origin "null"), and the
      // endpoint only allows CORS from our production domain, so fetch fails there.
      // An <img> needs no CORS, so use the endpoint as the image itself.
      return assetUrl;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // The endpoint may serve the image itself (galverse.art/pfp/<id> returns a PNG)
    // rather than metadata JSON; then the image is its own URL.
    if (response.headers.get("content-type")?.startsWith("image/")) {
      return response.url;
    }

    const data = await response.json();
    //return data;
    return data.image.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
  } else {
    throw new Error(`TokenId must be between 0 and ${MAX_TOKEN_ID}`);
  }
}
