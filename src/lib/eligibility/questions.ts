import type { LocalizedString } from "@/lib/i18n/types";
import { FIELD_SPEC_BY_FIELD } from "@/lib/profile/fields";
import type { Profile, ProfileField } from "@/types/profile";

/**
 * Follow-up questions. Answering one only changes the facts JSON; the rules
 * engine then re-runs locally. No language model is involved here.
 */

export type AnswerValue = string | number | boolean | null;

export type ChoiceOption = { value: AnswerValue; label: LocalizedString };

export type Question =
  | { field: ProfileField; kind: "choice"; text: LocalizedString; options: ChoiceOption[] }
  | {
      field: ProfileField;
      kind: "number";
      text: LocalizedString;
      min: number;
      max: number;
      unit: LocalizedString;
    };

const NOT_SURE: ChoiceOption = { value: null, label: { te: "తెలియదు", en: "Not sure" } };
const YES_NO: ChoiceOption[] = [
  { value: true, label: { te: "అవును", en: "Yes" } },
  { value: false, label: { te: "లేదు", en: "No" } },
  NOT_SURE,
];

// Upper edges of each band line up with the income limits the schemes use.
const INCOME_OPTIONS: ChoiceOption[] = [
  { value: 100000, label: { te: "₹1 లక్ష లోపు", en: "Up to ₹1 lakh" } },
  { value: 150000, label: { te: "₹1 - 1.5 లక్షలు", en: "₹1 to 1.5 lakh" } },
  { value: 200000, label: { te: "₹1.5 - 2 లక్షలు", en: "₹1.5 to 2 lakh" } },
  { value: 250000, label: { te: "₹2 - 2.5 లక్షలు", en: "₹2 to 2.5 lakh" } },
  { value: 300000, label: { te: "₹2.5 - 3 లక్షలు", en: "₹2.5 to 3 lakh" } },
  { value: 349999, label: { te: "₹3 - 3.5 లక్షలు", en: "₹3 to 3.5 lakh" } },
  { value: 450000, label: { te: "₹3.5 - 4.5 లక్షలు", en: "₹3.5 to 4.5 lakh" } },
  { value: 499999, label: { te: "₹4.5 - 5 లక్షలు", en: "₹4.5 to 5 lakh" } },
  { value: 799999, label: { te: "₹5 - 8 లక్షలు", en: "₹5 to 8 lakh" } },
  { value: 1000000, label: { te: "₹8 లక్షల పైన", en: "Above ₹8 lakh" } },
  NOT_SURE,
];

const QUESTION_TEXT: Partial<Record<ProfileField, LocalizedString>> = {
  area: { te: "మీరు గ్రామంలో ఉంటారా, పట్టణంలోనా?", en: "Do you live in a village or a town/city?" },
  age: { te: "మీ వయస్సు ఎంత?", en: "How old are you?" },
  gender: { te: "మీరు...", en: "You are..." },
  socialCategory: { te: "మీ సామాజిక వర్గం ఏది?", en: "Which category do you belong to?" },
  annualFamilyIncome: { te: "మీ కుటుంబ మొత్తం ఆదాయం సంవత్సరానికి ఎంత?", en: "What is your family's total income in a year?" },
  rationCard: { te: "మీ కుటుంబానికి తెల్ల రేషన్ కార్డు (ఆహార భద్రత కార్డు) ఉందా?", en: "Does your family have a white ration card (food security card)?" },
  maritalStatus: { te: "మీ వివాహ స్థితి ఏమిటి?", en: "What is your marital status?" },
  occupation: { te: "మీరు ఏ పని చేస్తారు?", en: "What work do you do?" },
  educationLevel: { te: "మీరు ఇప్పుడు ఏమి చదువుతున్నారు?", en: "What are you studying now?" },
  courseType: { te: "మీ కోర్సు ఏ రకం?", en: "What type of course is it?" },
  courseYear: { te: "కోర్సులో ఏ సంవత్సరం?", en: "Which year of the course are you in?" },
  institutionType: { te: "మీ స్కూల్ / కాలేజీ ఏ రకం?", en: "What type of school or college is it?" },
  classXIIPercentile: { te: "ఇంటర్ బోర్డులో మీ పర్సెంటైల్ ఎంత?", en: "What was your Class 12 board percentile?" },
  graduationPercentage: { te: "డిగ్రీలో మీకు ఎంత శాతం వచ్చింది?", en: "What percentage did you get in your degree?" },
  marksPercentage: { te: "గత తరగతిలో ఎంత శాతం మార్కులు వచ్చాయి?", en: "What percentage did you get in your last class?" },
  parentOccupation: { te: "మీ తల్లి లేదా తండ్రి ఏ పని చేస్తారు?", en: "What work does your parent do?" },
  hasForeignAdmission: { te: "విదేశీ యూనివర్సిటీలో అడ్మిషన్ వచ్చిందా?", en: "Do you have an admission at a foreign university?" },
  isDisabled: { te: "మీకు ఏదైనా వైకల్యం ఉందా?", en: "Do you have a disability?" },
  disabilityPercent: { te: "సర్టిఫికెట్ ప్రకారం వైకల్య శాతం ఎంత?", en: "What disability percentage is on your certificate?" },
  landAcres: { te: "మీ కుటుంబానికి ఎన్ని ఎకరాల భూమి ఉంది?", en: "How many acres of land does your family have?" },
  isPattadar: { te: "భూమి మీ పేరు మీద ఉందా (పట్టాదారు పాస్‌బుక్)?", en: "Is the land in your name (pattadar passbook)?" },
  hasMgnregsJobCard: { te: "మీకు ఉపాధి హామీ జాబ్ కార్డు ఉందా?", en: "Do you have a MGNREGS job card?" },
  isShgMember: { te: "మీరు స్వయం సహాయక సంఘం (డ్వాక్రా) సభ్యురాలా?", en: "Are you a member of a self-help group (DWCRA)?" },
  ownsPuccaHouse: { te: "మీ కుటుంబానికి సొంత పక్కా ఇల్లు ఉందా?", en: "Does your family own a pucca house?" },
  hasDomesticElectricity: { te: "మీ ఇంటికి కరెంటు కనెక్షన్ ఉందా?", en: "Does your home have an electricity connection?" },
  monthlyElectricityUnits: { te: "నెలకు సుమారు ఎన్ని యూనిట్ల కరెంటు వాడతారు?", en: "About how many units of electricity do you use a month?" },
  hasLpgInOwnName: { te: "గ్యాస్ కనెక్షన్ మీ (మహిళ) పేరు మీద ఉందా?", en: "Is the gas connection in your (the woman's) name?" },
  householdHasLpg: { te: "మీ ఇంట్లో గ్యాస్ కనెక్షన్ ఉందా?", en: "Does your household have a gas connection?" },
  daughterMarriagePlanned: { te: "త్వరలో మీ కూతురి పెళ్లి ఉందా?", en: "Is your daughter's wedding coming up?" },
  receivesPension: { te: "మీకు ఇప్పటికే ఏదైనా ప్రభుత్వ పింఛన్ వస్తోందా?", en: "Do you already get any government pension?" },
  isGovtEmployeeFamily: { te: "మీ కుటుంబంలో ఎవరైనా ప్రభుత్వ ఉద్యోగి ఉన్నారా?", en: "Is anyone in your family a government employee?" },
  isIncomeTaxPayer: { te: "మీరు ఆదాయపు పన్ను కడతారా?", en: "Do you pay income tax?" },
  wantsToStartBusiness: { te: "చిన్న వ్యాపారం మొదలుపెట్టాలని అనుకుంటున్నారా?", en: "Do you want to start a small business?" },
  hostelResident: { te: "మీరు హాస్టల్‌లో ఉంటారా?", en: "Do you stay in a hostel?" },
  plansStudyAbroad: { te: "విదేశాల్లో చదవాలని అనుకుంటున్నారా?", en: "Do you plan to study abroad?" },
};

const NUMBER_LIMITS: Partial<Record<ProfileField, { min: number; max: number; unit: LocalizedString }>> = {
  age: { min: 0, max: 120, unit: { te: "ఏళ్లు", en: "years" } },
  courseYear: { min: 1, max: 6, unit: { te: "వ సంవత్సరం", en: "year" } },
  classXIIPercentile: { min: 0, max: 100, unit: { te: "%", en: "%" } },
  graduationPercentage: { min: 0, max: 100, unit: { te: "%", en: "%" } },
  marksPercentage: { min: 0, max: 100, unit: { te: "%", en: "%" } },
  disabilityPercent: { min: 0, max: 100, unit: { te: "%", en: "%" } },
  landAcres: { min: 0, max: 500, unit: { te: "ఎకరాలు", en: "acres" } },
  monthlyElectricityUnits: { min: 0, max: 5000, unit: { te: "యూనిట్లు", en: "units" } },
};

export function questionFor(field: ProfileField): Question | null {
  const spec = FIELD_SPEC_BY_FIELD.get(field);
  const text = QUESTION_TEXT[field];
  if (!spec || !text) return null;

  if (field === "annualFamilyIncome") return { field, kind: "choice", text, options: INCOME_OPTIONS };

  if (spec.kind === "boolean") return { field, kind: "choice", text, options: YES_NO };

  if (spec.kind === "enum") {
    const options: ChoiceOption[] = spec.values
      .filter((value) => !(field === "rationCard" && value === "unknown"))
      .map((value) => ({ value, label: spec.valueLabels[value] ?? { te: value, en: value } }));
    return { field, kind: "choice", text, options: [...options, NOT_SURE] };
  }

  const limits = NUMBER_LIMITS[field];
  if (!limits) return null;
  return { field, kind: "number", text, ...limits };
}

/**
 * Apply one answer to the facts. "Not sure" (null) leaves the fact unknown;
 * the caller records the field as asked so it isn't asked again.
 */
export function applyAnswer(facts: Profile, field: ProfileField, value: AnswerValue): Profile {
  const next: Record<string, unknown> = { ...facts };
  if (value === null) delete next[field];
  else next[field] = value;

  // Keep obviously linked facts consistent.
  if (field === "disabilityPercent" && typeof value === "number") next.isDisabled = value > 0;
  if (field === "isDisabled" && value === false) next.disabilityPercent = 0;
  if (field === "occupation" && value === "tenant_farmer") next.isPattadar = false;

  return next as Profile;
}
