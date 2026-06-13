import { Campaign } from "@entities/Campaign";

const result = Campaign.make("My Campaign");
if (result.value) {
  console.log("Campaign:", result.value.export());
}
