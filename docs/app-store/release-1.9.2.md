# Wendao AI 1.9.2 (24)

## Subscription offer display repair

The previous native product bridge returned only the standard renewal price. The paywall now reads StoreKit introductory offer terms and the current Apple account's eligibility. Eligible offers show their localized price, full discounted period and subsequent standard renewal price. Unknown or ineligible offers are not advertised. Users can reload prices without waiting for an error.

This does not override Apple purchase eligibility or prove that a production purchase sheet will grant an offer. The existing App Store build on the user's phone showed standard monthly and annual prices; no purchase was completed. Lifetime reading was verified at CNY 2.00.

Configured campaign: 2026-09-16 through 2026-10-16 in 175 territories. China mainland monthly first month CNY 13.80 and annual first full year CNY 140; standard renewals CNY 68/month and CNY 698/year. USD offers 3.99 and 39.99. Lifetime CNY 2 / USD 1.39 temporarily, with original price scheduled to return. Subscription introductory eligibility is determined by Apple, not the app login or membership record.

An unused monthly offer-code definition was created while investigating a fallback, then deactivated before any codes were generated because its introductory-offer stacking setting did not match the intended campaign. No codes were distributed.

## Validation

- 159 tests passed, including eligible, ineligible, unknown and incomplete offer terms.
- TypeScript, runtime protection, 81-chapter and Silk B integrity checks passed during iOS sync.
- iOS simulator build and Release archive succeeded.
- App Store upload succeeded on 2026-09-16 at 10:36 China time.
- Archive: ~/Library/Developer/Xcode/Archives/2026-09-16/Wendao AI 1.9.2 (24).xcarchive.
- Review submission status is recorded below after external readback.

## What's New — zh-Hans

优化会员订阅价格展示：符合 Apple 优惠资格时，显示优惠价格、优惠期限及后续续费价格。新增重新读取价格入口，让购买前的方案信息更清楚。

## What's New — en-US

Improved subscription pricing: eligible introductory offers now show their price, full offer period and standard renewal price. You can also refresh App Store prices before choosing a plan.
