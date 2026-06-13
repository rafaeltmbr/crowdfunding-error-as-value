import { Campaign } from "@entities/Campaign";
import { Tier } from "@entities/Tier";

function main() {
  const name = "My Campaign";
  const tiers = [
    Tier.make("Bronze", 10).value!,
    Tier.make("Silver", 20).value!,
    Tier.make("Gold", 50).value!,
  ];

  const campaignResult = Campaign.make(name, tiers);
  if (campaignResult.error) return console.error(campaignResult.error);

  const campaign = campaignResult.value;

  const addTierResult = campaign.addTier(Tier.make("Platinum", 100).value!);
  if (addTierResult.error) return console.error(addTierResult);

  console.log("Campaign:", campaign.export());
}

main();
