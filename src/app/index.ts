import { Campaign } from "@entities/Campaign";
import { Tier } from "@entities/Tier";

function main() {
  const name = "My Campaign";
  const tiers = [
    Tier.make("Bronze", 10).value!,
    Tier.make("Silver", 20).value!,
    Tier.make("Gold", 50).value!,
  ];

  const result = Campaign.make(name, tiers);
  if (result.error) return console.error(result.error);

  console.log("Campaign:", result.value.export());
}

main();
