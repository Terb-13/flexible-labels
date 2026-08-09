import { EstimatingEngine } from "../src/lib/estimating/EstimatingEngine";
import {
  getEstimateByShareToken,
  runEstimateWorkflow,
  saveEstimate,
} from "../src/lib/estimating/estimates-store";

async function main() {
  const engine = new EstimatingEngine();
  const priced = engine.estimate({
    family: "pressure_sensitive",
    productType: "ps_label",
    quantity: 10000,
    dimensions: { widthIn: 2.25, lengthIn: 3.5 },
    material: {
      id: "m",
      name: "Matte BOPP",
      family: "pressure_sensitive",
      costPerMsi: 0.42,
    },
    ink: { colors: 4 },
    finishing: { dieCut: true, rewind: true },
  });
  const draft = await saveEstimate({
    customerName: "Acme",
    productLabel: "PS labels",
    priced,
    actorRole: "cx",
    status: "draft",
  });
  const queued = await runEstimateWorkflow(draft.id, "submit", "cx", "Alex");
  const claimed = await runEstimateWorkflow(queued.id, "claim", "ep", "Sam");
  const sent = await runEstimateWorkflow(claimed.id, "send", "ep", "Sam");
  const shared = await getEstimateByShareToken(sent.shareToken!);
  console.log({
    status: sent.status,
    share: !!shared,
    press: sent.pressName,
    sell: sent.sellPrice,
    token: sent.shareToken?.slice(0, 8) + "…",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
