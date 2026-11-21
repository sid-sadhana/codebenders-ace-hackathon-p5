import { schemes } from "../src/data/schemes";
import { recommend } from "../src/lib/eligibility/recommend";
import { understandText } from "../src/lib/extract/understand";

// Fictional sample messages, one per demo persona, plus an unclear one.
const SAMPLES = [
  "నేను బీసీ-బి విద్యార్థినిని, నల్గొండలో బి.టెక్ రెండో సంవత్సరం చదువుతున్నాను. మా కుటుంబ ఆదాయం సంవత్సరానికి 1.2 లక్షలు, తెల్ల రేషన్ కార్డు ఉంది.",
  "నేను ఎస్సీ, హైదరాబాద్‌లో డిగ్రీ చివరి సంవత్సరం. నాకు 45% వైకల్యం ఉంది. తెల్ల రేషన్ కార్డు లేదు. ఆదాయం 2.2 లక్షలు.",
  "నేను మైనారిటీ అమ్మాయిని, బి.టెక్ పూర్తయింది, 72% వచ్చాయి. జర్మనీలో ఎంఎస్ అడ్మిషన్ వచ్చింది. ఆదాయం మూడున్నర లక్షలు.",
  "నా వయస్సు 66, మా ఆయన చనిపోయారు. కరీంనగర్ దగ్గర పల్లెటూరులో ఉంటాను. తెల్ల కార్డు ఉంది, పింఛన్ రావట్లేదు.",
  "నా వయస్సు 64, భర్త లేరు. పల్లెటూరు, తెల్ల కార్డు ఉంది.",
  "నేను కౌలు రైతుని, ఖమ్మంలో 2 ఎకరాలు కౌలుకు చేస్తున్నాను. సొంత భూమి లేదు. ఉపాధి హామీ జాబ్ కార్డు ఉంది.",
  "naaku 3 ekaralu sontha bhoomi undi Siddipet lo, pattadar passbook undi, white card undi",
  "మా అమ్మాయి పెళ్లి వచ్చే నెల. మేము ఎస్సీ. పక్కా ఇల్లు లేదు, కరెంటు బిల్లు నెలకు 150 యూనిట్లు. నా ఆధార్ 1234 5678 9012.",
];

async function main() {
  for (const sample of SAMPLES) {
    const started = Date.now();
    const result = await understandText(sample);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`\n=== ${sample}\n(${seconds}s)`);
    if (!result.ok) {
      console.log("ERROR:", result.error);
      continue;
    }
    console.log("EN:", result.translationEn);
    console.log("facts:", JSON.stringify(result.facts));
    if (result.toConfirm.length) console.log("confirm:", result.toConfirm.join(", "));
    for (const a of result.ambiguities) console.log(`ask: ${a.field} [${a.options.join(" / ")}] from "${a.quote}"`);
    if (result.redacted) console.log("(identity numbers removed before sending)");

    const rec = recommend(result.facts, schemes);
    const list = (xs: typeof rec.applyNow) => xs.map((e) => `${e.scheme.id}${e.eligibility === "possibly" ? "?" : ""}`).join(", ");
    console.log("apply now:", list(rec.applyNow.slice(0, 6)));
    console.log("not open now:", list(rec.notOpenNow.slice(0, 4)));
    console.log("next questions:", rec.questions.map((q) => q.field).join(", "));
  }
}

main();
