import type { StoreKitProduct } from "./storekit";

/** Only advertise offers whose eligibility and full terms are known. */
export function subscriptionOffer(product: StoreKitProduct | undefined, language: "zh" | "en") {
  const offer = product?.introductoryOffer;
  if (!product || product.introOfferEligible !== true || !offer ||
      !offer.displayPrice || !Number.isInteger(offer.periodValue) || offer.periodValue < 1 ||
      !Number.isInteger(offer.periodCount) || offer.periodCount < 1 ||
      !["day", "week", "month", "year"].includes(offer.periodUnit) ||
      !["payUpFront", "payAsYouGo", "freeTrial"].includes(offer.paymentMode)) return null;
  const zh = language === "zh";
  const units = { day: "天", week: "周", month: "个月", year: "年", unknown: "" };
  const duration = (n: number) => zh ? `${n} ${units[offer.periodUnit]}` : `${n} ${offer.periodUnit}${n === 1 ? "" : "s"}`;
  const total = duration(offer.periodValue * offer.periodCount);
  if (offer.paymentMode === "freeTrial") return { price: zh ? "免费试用" : "Free trial", terms: zh ? `免费 ${total}` : `Free for ${total}` };
  return {
    price: offer.displayPrice,
    terms: offer.paymentMode === "payUpFront"
      ? (zh ? `前 ${total}共 ${offer.displayPrice}` : `${offer.displayPrice} total for the first ${total}`)
      : (zh ? `前 ${total}，每 ${duration(offer.periodValue)} ${offer.displayPrice}` : `${offer.displayPrice} every ${duration(offer.periodValue)} for the first ${total}`),
  };
}
