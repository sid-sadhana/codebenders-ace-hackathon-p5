import type { LocalizedString } from "@/lib/i18n/types";
import type { Profile, ProfileField } from "@/types/profile";

/**
 * One place that describes every profile fact. It drives:
 *  - the structured-output schema the language model must fill,
 *  - the meaning guide that maps many phrasings onto one canonical value,
 *  - the chips that show what was understood, and the follow-up questions.
 */

export const TELANGANA_DISTRICTS = [
  "Adilabad",
  "Bhadradri Kothagudem",
  "Hanumakonda",
  "Hyderabad",
  "Jagtial",
  "Jangaon",
  "Jayashankar Bhupalpally",
  "Jogulamba Gadwal",
  "Kamareddy",
  "Karimnagar",
  "Khammam",
  "Kumuram Bheem Asifabad",
  "Mahabubabad",
  "Mahabubnagar",
  "Mancherial",
  "Medak",
  "Medchal-Malkajgiri",
  "Mulugu",
  "Nagarkurnool",
  "Nalgonda",
  "Narayanpet",
  "Nirmal",
  "Nizamabad",
  "Peddapalli",
  "Rajanna Sircilla",
  "Rangareddy",
  "Sangareddy",
  "Siddipet",
  "Suryapet",
  "Vikarabad",
  "Wanaparthy",
  "Warangal",
  "Yadadri Bhuvanagiri",
] as const;

type Base = {
  field: ProfileField;
  label: LocalizedString;
  /** Plain-English guide for the extractor: what counts as each value. */
  meaning: string;
  /** Fields that decide eligibility for many schemes are never guessed. */
  gating?: boolean;
};

export type EnumSpec = Base & {
  kind: "enum";
  values: readonly string[];
  valueLabels: Record<string, LocalizedString>;
};
export type NumberSpec = Base & {
  kind: "number";
  unit: "rupees_per_year" | "years" | "percent" | "acres" | "units_per_month" | "year_of_course";
};
export type BooleanSpec = Base & {
  kind: "boolean";
  valueLabels: { true: LocalizedString; false: LocalizedString };
};

export type FieldSpec = EnumSpec | NumberSpec | BooleanSpec;

const yes = (te: string, en: string) => ({ te, en });

export const FIELD_SPECS: FieldSpec[] = [
  {
    field: "district",
    kind: "enum",
    label: { te: "జిల్లా", en: "District" },
    values: TELANGANA_DISTRICTS,
    valueLabels: {},
    meaning:
      "Telangana district the person lives in, mapped to the official English name. A town or village maps to its district only if you are certain (e.g. Secunderabad -> Hyderabad, Hanamkonda -> Hanumakonda). Otherwise null.",
  },
  {
    field: "area",
    kind: "enum",
    label: { te: "ప్రాంతం", en: "Area" },
    values: ["rural", "urban"],
    valueLabels: { rural: yes("గ్రామీణ", "Rural"), urban: yes("పట్టణ", "Urban") },
    gating: true,
    meaning:
      "rural = village, palle, పల్లె, పల్లెటూరు, గ్రామం, thanda. urban = city or town, పట్టణం, నగరం, Hyderabad city, municipality. Hyderabad district is urban. Do not infer from district alone otherwise.",
  },
  {
    field: "age",
    kind: "number",
    unit: "years",
    label: { te: "వయస్సు", en: "Age" },
    gating: true,
    meaning: "Age of the person the schemes are for, in whole years. Only if a number is stated (e.g. 'నా వయస్సు 66', '66 ఏళ్లు', '66 years').",
  },
  {
    field: "gender",
    kind: "enum",
    label: { te: "లింగం", en: "Gender" },
    values: ["female", "male", "other"],
    valueLabels: { female: yes("స్త్రీ", "Female"), male: yes("పురుషుడు", "Male"), other: yes("ఇతర", "Other") },
    meaning:
      "female if the person refers to themself with feminine words: అమ్మాయి, విద్యార్థిని, గృహిణి, వితంతువు, సభ్యురాలు, girl, woman, mother, wife, widow, housewife. male for అబ్బాయి, విద్యార్థి (when clearly male), boy, man, husband. other for transgender. Otherwise null.",
  },
  {
    field: "socialCategory",
    kind: "enum",
    label: { te: "సామాజిక వర్గం", en: "Category" },
    values: ["SC", "ST", "BC-A", "BC-B", "BC-C", "BC-D", "BC-E", "EBC", "Minority", "General"],
    valueLabels: {
      SC: yes("ఎస్సీ", "SC"),
      ST: yes("ఎస్టీ", "ST"),
      "BC-A": yes("బీసీ-ఏ", "BC-A"),
      "BC-B": yes("బీసీ-బి", "BC-B"),
      "BC-C": yes("బీసీ-సి", "BC-C"),
      "BC-D": yes("బీసీ-డి", "BC-D"),
      "BC-E": yes("బీసీ-ఈ", "BC-E"),
      EBC: yes("ఈబీసీ", "EBC"),
      Minority: yes("మైనారిటీ", "Minority"),
      General: yes("ఓసీ / జనరల్", "OC / General"),
    },
    gating: true,
    meaning:
      "Caste category as stated. ఎస్సీ/SC/dalit -> SC. ఎస్టీ/ST/tribal/lambada/koya -> ST. BC with a group letter -> that group; plain 'BC' with no letter -> null and add an ambiguity. Muslim, Christian, minority, మైనారిటీ -> Minority. OC, ఓసీ, general, forward caste -> General. EBC -> EBC. Never guess from a name or surname.",
  },
  {
    field: "annualFamilyIncome",
    kind: "number",
    unit: "rupees_per_year",
    label: { te: "కుటుంబ ఆదాయం", en: "Family income" },
    gating: true,
    meaning:
      "Total family income per YEAR in rupees as an integer. 1 lakh = 100000. '1.5 లక్షలు', 'ఒకటిన్నర లక్ష', '1.5L', '1,50,000' -> 150000. 'మూడున్నర లక్షలు' -> 350000. If a monthly amount is given (నెలకు, per month), multiply by 12. '8 వేలు' = 8000. If it is only one member's salary and no family total, still use it.",
  },
  {
    field: "rationCard",
    kind: "enum",
    label: { te: "రేషన్ కార్డు", en: "Ration card" },
    values: ["white_phh", "aay", "annapurna", "none", "applied", "unknown"],
    valueLabels: {
      white_phh: yes("తెల్ల రేషన్ కార్డు ఉంది", "Has white ration card"),
      aay: yes("అంత్యోదయ కార్డు", "Antyodaya card"),
      annapurna: yes("అన్నపూర్ణ కార్డు", "Annapurna card"),
      none: yes("రేషన్ కార్డు లేదు", "No ration card"),
      applied: yes("దరఖాస్తు చేశారు", "Applied for card"),
      unknown: yes("తెలియదు", "Not sure"),
    },
    gating: true,
    meaning:
      "white_phh = has a white ration card / food security card / తెల్ల రేషన్ కార్డు / తెల్ల కార్డు / ఆహార భద్రత కార్డు / plain 'ration card ఉంది'. aay = Antyodaya / అంత్యోదయ / pink card. annapurna = Annapurna card. none = says they do NOT have one (లేదు, no card). applied = applied but not received. unknown = says they don't know.",
  },
  {
    field: "maritalStatus",
    kind: "enum",
    label: { te: "వివాహ స్థితి", en: "Marital status" },
    values: ["married", "unmarried", "widowed", "separated"],
    valueLabels: {
      married: yes("వివాహితులు", "Married"),
      unmarried: yes("అవివాహితులు", "Unmarried"),
      widowed: yes("వితంతువు / భార్య చనిపోయారు", "Widowed"),
      separated: yes("విడిపోయారు / విడాకులు", "Separated or divorced"),
    },
    gating: true,
    meaning:
      "widowed ONLY when the spouse's death is stated or clearly implied: widow, widower, వితంతువు, విధవ, 'భర్త చనిపోయారు', 'భర్త పోయారు', 'husband passed away', 'late husband', 'wife died'. separated = separated, divorced, విడాకులు, 'భర్త వదిలేశాడు', 'living apart'. unmarried = never married, పెళ్లి కాలేదు. married = భర్త/భార్య is alive and with them. 'భర్త లేరు' / 'no husband' / 'I am alone' does NOT say why: set null and add an ambiguity.",
  },
  {
    field: "occupation",
    kind: "enum",
    label: { te: "వృత్తి", en: "Occupation" },
    values: [
      "student",
      "daily_wage",
      "farmer_owner",
      "tenant_farmer",
      "agri_labourer",
      "construction_worker",
      "weaver",
      "toddy_tapper",
      "beedi_worker",
      "artisan",
      "self_employed",
      "salaried",
      "homemaker",
      "unemployed",
      "retired",
    ],
    valueLabels: {
      student: yes("విద్యార్థి", "Student"),
      daily_wage: yes("రోజు కూలి", "Daily wage worker"),
      farmer_owner: yes("సొంత భూమి రైతు", "Farmer with own land"),
      tenant_farmer: yes("కౌలు రైతు", "Tenant farmer"),
      agri_labourer: yes("వ్యవసాయ కూలి", "Farm labourer"),
      construction_worker: yes("భవన నిర్మాణ కార్మికులు", "Construction worker"),
      weaver: yes("చేనేత కార్మికులు", "Weaver"),
      toddy_tapper: yes("గీత కార్మికులు", "Toddy tapper"),
      beedi_worker: yes("బీడీ కార్మికులు", "Beedi worker"),
      artisan: yes("చేతివృత్తి కళాకారులు", "Artisan"),
      self_employed: yes("స్వయం ఉపాధి", "Self-employed"),
      salaried: yes("ఉద్యోగి", "Salaried"),
      homemaker: yes("గృహిణి", "Homemaker"),
      unemployed: yes("నిరుద్యోగి", "Unemployed"),
      retired: yes("రిటైర్డ్", "Retired"),
    },
    meaning:
      "The person's own work. student = చదువుతున్నాను, studying. farmer_owner = farms their own land (సొంత భూమి, పట్టా). tenant_farmer = కౌలు, leases land, sharecropper. agri_labourer = works on others' fields for wages. daily_wage = కూలి పని (non-farm). homemaker = గృహిణి, housewife. retired = రిటైర్ అయ్యాను.",
  },
  {
    field: "educationLevel",
    kind: "enum",
    label: { te: "చదువు", en: "Education" },
    values: ["none", "class_1_8", "class_9_10", "class_11_12", "diploma", "iti", "ug", "pg"],
    valueLabels: {
      none: yes("చదువుకోవడం లేదు", "Not studying"),
      class_1_8: yes("1 నుంచి 8వ తరగతి", "Class 1 to 8"),
      class_9_10: yes("9 లేదా 10వ తరగతి", "Class 9 or 10"),
      class_11_12: yes("ఇంటర్మీడియట్", "Intermediate"),
      diploma: yes("డిప్లొమా / పాలిటెక్నిక్", "Diploma"),
      iti: yes("ఐటీఐ", "ITI"),
      ug: yes("డిగ్రీ / బి.టెక్", "Degree / B.Tech"),
      pg: yes("పీజీ / మాస్టర్స్", "PG / Masters"),
    },
    meaning:
      "What the person is studying NOW (or the course they are admitted to). none = not studying (working, retired, homemaker, finished studies with no new admission). Intermediate/inter/+2 -> class_11_12. B.Tech, B.E, B.Sc, B.Com, B.A, degree, MBBS -> ug. M.Tech, MS, MBA, M.Sc, masters -> pg (also if they have an admission abroad for masters). Polytechnic -> diploma.",
  },
  {
    field: "courseType",
    kind: "enum",
    label: { te: "కోర్సు రకం", en: "Course type" },
    values: ["general", "technical", "professional", "medical"],
    valueLabels: {
      general: yes("సాధారణ డిగ్రీ", "General degree"),
      technical: yes("టెక్నికల్", "Technical"),
      professional: yes("ప్రొఫెషనల్", "Professional"),
      medical: yes("మెడికల్", "Medical"),
    },
    meaning:
      "general = B.A, B.Com, B.Sc and similar. professional = B.Tech, B.E, engineering, pharmacy, law, MBA. medical = MBBS, BDS, nursing. technical = diploma, ITI, other AICTE technical courses.",
  },
  {
    field: "courseYear",
    kind: "number",
    unit: "year_of_course",
    label: { te: "సంవత్సరం", en: "Year of course" },
    meaning: "Current year of the course: 'రెండో సంవత్సరం' / '2nd year' -> 2. 'చివరి సంవత్సరం' / 'final year' of a 3-year degree -> 3, of B.Tech -> 4.",
  },
  {
    field: "institutionType",
    kind: "enum",
    label: { te: "కళాశాల", en: "College type" },
    values: ["government", "aided", "private"],
    valueLabels: {
      government: yes("ప్రభుత్వ", "Government"),
      aided: yes("ఎయిడెడ్", "Aided"),
      private: yes("ప్రైవేట్", "Private"),
    },
    meaning: "Type of school or college: ప్రభుత్వ/government, aided, ప్రైవేట్/private.",
  },
  {
    field: "classXIIPercentile",
    kind: "number",
    unit: "percent",
    label: { te: "ఇంటర్ పర్సెంటైల్", en: "Class 12 percentile" },
    meaning: "Class 12 / Intermediate board result as a percentile or percentage, only if stated.",
  },
  {
    field: "graduationPercentage",
    kind: "number",
    unit: "percent",
    label: { te: "డిగ్రీ మార్కులు", en: "Degree marks" },
    meaning: "Graduation (degree) percentage, only if stated.",
  },
  {
    field: "marksPercentage",
    kind: "number",
    unit: "percent",
    label: { te: "గత తరగతి మార్కులు", en: "Last exam marks" },
    meaning: "Marks percentage in the last school exam (for school students), only if stated.",
  },
  {
    field: "hostelResident",
    kind: "boolean",
    label: { te: "హాస్టల్", en: "Hostel" },
    valueLabels: { true: yes("హాస్టల్‌లో ఉంటారు", "Lives in hostel"), false: yes("ఇంటి నుంచి వెళ్తారు", "Day scholar") },
    meaning: "true if the student stays in a hostel; false if they say they go from home / day scholar.",
  },
  {
    field: "parentOccupation",
    kind: "enum",
    label: { te: "తల్లిదండ్రుల వృత్తి", en: "Parent's work" },
    values: ["daily_wage", "farmer", "self_employed", "salaried", "hazardous_work", "other"],
    valueLabels: {
      daily_wage: yes("కూలి", "Daily wage"),
      farmer: yes("రైతు", "Farmer"),
      self_employed: yes("స్వయం ఉపాధి", "Self-employed"),
      salaried: yes("ఉద్యోగం", "Salaried"),
      hazardous_work: yes("ప్రమాదకర పని", "Hazardous work"),
      other: yes("ఇతర", "Other"),
    },
    meaning:
      "For students: the main parent's work. hazardous_work = manual scavenging, waste picking, tanning/flaying, sewer or hazardous cleaning.",
  },
  {
    field: "hasForeignAdmission",
    kind: "boolean",
    label: { te: "విదేశీ అడ్మిషన్", en: "Admission abroad" },
    valueLabels: { true: yes("విదేశీ అడ్మిషన్ ఉంది", "Has admission abroad"), false: yes("విదేశీ అడ్మిషన్ లేదు", "No admission abroad") },
    meaning: "true only if they already HAVE an admission or offer from a foreign university. Just planning to go abroad is not enough (use plansStudyAbroad).",
  },
  {
    field: "plansStudyAbroad",
    kind: "boolean",
    label: { te: "విదేశాల్లో చదువు", en: "Study abroad" },
    valueLabels: { true: yes("విదేశాల్లో చదవాలని ఉంది", "Plans to study abroad"), false: yes("లేదు", "No") },
    meaning: "true if they want to or plan to study abroad.",
  },
  {
    field: "isDisabled",
    kind: "boolean",
    label: { te: "వైకల్యం", en: "Disability" },
    valueLabels: { true: yes("వైకల్యం ఉంది", "Has a disability"), false: yes("వైకల్యం లేదు", "No disability") },
    meaning: "true for వైకల్యం, వికలాంగులు, దివ్యాంగులు, handicapped, disabled, PH, any stated disability percentage.",
  },
  {
    field: "disabilityPercent",
    kind: "number",
    unit: "percent",
    label: { te: "వైకల్య శాతం", en: "Disability %" },
    meaning: "Certified disability percentage if stated (e.g. '45% వైకల్యం' -> 45).",
  },
  {
    field: "landAcres",
    kind: "number",
    unit: "acres",
    label: { te: "భూమి", en: "Land" },
    meaning: "Acres of land the family farms or owns (ఎకరాలు). Guntas: 40 guntas = 1 acre. For tenants, the leased acres.",
  },
  {
    field: "isPattadar",
    kind: "boolean",
    label: { te: "పట్టాదారు", en: "Pattadar" },
    valueLabels: { true: yes("పట్టా భూమి ఉంది", "Owns land (pattadar)"), false: yes("సొంత పట్టా భూమి లేదు", "No land in own name") },
    gating: true,
    meaning:
      "true if the land is in their (family's) name: సొంత భూమి, పట్టా, పట్టాదారు పాస్‌బుక్, own land. false for tenant / కౌలు / landless / 'సొంత భూమి లేదు'.",
  },
  {
    field: "hasMgnregsJobCard",
    kind: "boolean",
    label: { te: "ఉపాధి హామీ జాబ్ కార్డు", en: "MGNREGS job card" },
    valueLabels: { true: yes("జాబ్ కార్డు ఉంది", "Has job card"), false: yes("జాబ్ కార్డు లేదు", "No job card") },
    meaning: "true if they have a MGNREGS / ఉపాధి హామీ job card or do ఉపాధి హామీ పని.",
  },
  {
    field: "isShgMember",
    kind: "boolean",
    label: { te: "స్వయం సహాయక సంఘం", en: "SHG member" },
    valueLabels: { true: yes("సంఘం సభ్యురాలు", "SHG member"), false: yes("సంఘంలో లేరు", "Not in an SHG") },
    meaning: "true for self-help group, SHG, DWCRA, డ్వాక్రా, పొదుపు సంఘం, మహిళా సంఘం, స్వయం సహాయక సంఘం membership.",
  },
  {
    field: "ownsPuccaHouse",
    kind: "boolean",
    label: { te: "పక్కా ఇల్లు", en: "Pucca house" },
    valueLabels: { true: yes("పక్కా ఇల్లు ఉంది", "Owns a pucca house"), false: yes("పక్కా ఇల్లు లేదు", "No pucca house") },
    meaning: "true if the family owns a concrete/pucca house. false for 'ఇల్లు లేదు', kutcha house, hut, గుడిసె, renting with no house of their own.",
  },
  {
    field: "hasDomesticElectricity",
    kind: "boolean",
    label: { te: "కరెంటు కనెక్షన్", en: "Electricity connection" },
    valueLabels: { true: yes("కరెంటు కనెక్షన్ ఉంది", "Has electricity"), false: yes("కరెంటు కనెక్షన్ లేదు", "No electricity") },
    meaning: "true if they mention a current/electricity bill or connection at home.",
  },
  {
    field: "monthlyElectricityUnits",
    kind: "number",
    unit: "units_per_month",
    label: { te: "కరెంటు వాడకం", en: "Electricity use" },
    meaning: "Electricity units used per month, if stated (e.g. 'నెలకు 150 యూనిట్లు' -> 150).",
  },
  {
    field: "hasLpgInOwnName",
    kind: "boolean",
    label: { te: "గ్యాస్ కనెక్షన్ (స్వంత పేరు)", en: "LPG in own name" },
    valueLabels: { true: yes("గ్యాస్ కనెక్షన్ తన పేరు మీద", "LPG in her name"), false: yes("గ్యాస్ తన పేరు మీద లేదు", "LPG not in her name") },
    meaning: "true if a gas (LPG) connection is in the woman's own name.",
  },
  {
    field: "householdHasLpg",
    kind: "boolean",
    label: { te: "ఇంట్లో గ్యాస్", en: "LPG at home" },
    valueLabels: { true: yes("ఇంట్లో గ్యాస్ ఉంది", "Has LPG at home"), false: yes("ఇంట్లో గ్యాస్ లేదు", "No LPG at home") },
    meaning: "true if the household has any gas/LPG connection. false if they cook with firewood / no gas.",
  },
  {
    field: "daughterMarriagePlanned",
    kind: "boolean",
    label: { te: "పెళ్లి", en: "Wedding" },
    valueLabels: { true: yes("త్వరలో పెళ్లి ఉంది", "Wedding coming up"), false: yes("పెళ్లి లేదు", "No wedding planned") },
    meaning:
      "true if a wedding is coming up for the bride: the person herself (a girl or woman who wants to marry, is getting married, 'పెళ్లి చేసుకోవాలి', 'పెళ్లి కుదిరింది', 'wanting to marry', 'engaged') or their daughter ('మా అమ్మాయి పెళ్లి', 'daughter's marriage'). A recent wedding also counts.",
  },
  {
    field: "receivesPension",
    kind: "boolean",
    label: { te: "పింఛన్", en: "Pension" },
    valueLabels: { true: yes("పింఛన్ వస్తోంది", "Gets a pension"), false: yes("పింఛన్ రావట్లేదు", "No pension") },
    meaning: "true if they already get any government pension. false for 'పింఛన్ రావట్లేదు' / no pension.",
  },
  {
    field: "isGovtEmployeeFamily",
    kind: "boolean",
    label: { te: "ప్రభుత్వ ఉద్యోగి కుటుంబం", en: "Govt employee in family" },
    valueLabels: { true: yes("కుటుంబంలో ప్రభుత్వ ఉద్యోగి ఉన్నారు", "Govt employee in family"), false: yes("లేరు", "No govt employee") },
    meaning: "true if someone in the family is a government employee.",
  },
  {
    field: "isIncomeTaxPayer",
    kind: "boolean",
    label: { te: "ఆదాయపు పన్ను", en: "Income tax" },
    valueLabels: { true: yes("ఆదాయపు పన్ను కడతారు", "Pays income tax"), false: yes("పన్ను కట్టరు", "No income tax") },
    meaning: "true only if they say they pay income tax.",
  },
  {
    field: "wantsToStartBusiness",
    kind: "boolean",
    label: { te: "వ్యాపారం", en: "Business" },
    valueLabels: { true: yes("వ్యాపారం మొదలుపెట్టాలని ఉంది", "Wants to start a business"), false: yes("లేదు", "No") },
    meaning: "true if they want to start or expand a small business, shop or unit, or ask about business loans.",
  },
];

export const FIELD_SPEC_BY_FIELD = new Map<ProfileField, FieldSpec>(
  FIELD_SPECS.map((spec) => [spec.field, spec]),
);

export const EXTRACTABLE_FIELDS = FIELD_SPECS.map((spec) => spec.field);

export const GATING_FIELDS = new Set<ProfileField>(
  FIELD_SPECS.filter((spec) => spec.gating).map((spec) => spec.field),
);

/** Display text for one understood fact, e.g. "Family income: ₹1,50,000". */
export function formatFactValue(
  field: ProfileField,
  value: Profile[ProfileField],
  lang: "te" | "en",
): string {
  const spec = FIELD_SPEC_BY_FIELD.get(field);
  if (!spec || value === undefined || value === null) return "";
  if (spec.kind === "enum") return spec.valueLabels[String(value)]?.[lang] ?? String(value);
  if (spec.kind === "boolean") return spec.valueLabels[value ? "true" : "false"][lang];
  const n = Number(value);
  switch (spec.unit) {
    case "rupees_per_year":
      return `₹${new Intl.NumberFormat("en-IN").format(n)}`;
    case "percent":
      return `${n}%`;
    case "acres":
      return lang === "te" ? `${n} ఎకరాలు` : `${n} acres`;
    case "years":
      return lang === "te" ? `${n} ఏళ్లు` : `${n} years`;
    case "units_per_month":
      return lang === "te" ? `నెలకు ${n} యూనిట్లు` : `${n} units/month`;
    case "year_of_course":
      return lang === "te" ? `${n}వ సంవత్సరం` : `Year ${n}`;
  }
}
