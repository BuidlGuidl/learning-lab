const SPEEDRUN_ETHEREUM_URL = "https://speedrunethereum.com";

type SpeedrunEthereumUtm = {
  // Lab slug where the link lives, "homepage", or "global" for site-wide placements.
  campaign: string;
  // Placement of the link, e.g. "continue_learning_cta".
  content: string;
};

/**
 * Builds a Speedrun Ethereum URL tagged with Learning Lab UTM params, so SRE can attribute visits and sign-ups.
 * Existing query params and hash in `path` are kept; UTM params already present are not overwritten.
 */
export const getSpeedrunEthereumUrl = ({ campaign, content }: SpeedrunEthereumUtm, path = "/") => {
  const url = new URL(path, SPEEDRUN_ETHEREUM_URL);
  const utmParams = {
    utm_source: "learning_lab",
    utm_medium: "referral",
    utm_campaign: campaign,
    utm_content: content,
  };

  for (const [key, value] of Object.entries(utmParams)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }

  return url.toString();
};
