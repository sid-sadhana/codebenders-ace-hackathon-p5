import { z } from "zod";

/**
 * Eligibility input. Every field is optional because people rarely state
 * everything; a missing field makes a rule "unknown", never "fail".
 * No identity numbers (Aadhaar, PAN, phone, bank account) belong here.
 */
export const profileSchema = z
  .object({
    state: z.string(),
    district: z.string(),
    area: z.enum(["rural", "urban"]),
    age: z.number().int().min(0).max(120),
    gender: z.enum(["female", "male", "other"]),
    socialCategory: z.enum([
      "SC",
      "ST",
      "BC-A",
      "BC-B",
      "BC-C",
      "BC-D",
      "BC-E",
      "EBC",
      "Minority",
      "General",
    ]),
    annualFamilyIncome: z.number().int().min(0),
    rationCard: z.enum([
      "white_phh",
      "aay",
      "annapurna",
      "none",
      "applied",
      "unknown",
    ]),
    maritalStatus: z.enum(["married", "unmarried", "widowed", "separated"]),
    occupation: z.enum([
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
    ]),

    educationLevel: z.enum([
      "none",
      "class_1_8",
      "class_9_10",
      "class_11_12",
      "diploma",
      "iti",
      "ug",
      "pg",
    ]),
    courseType: z.enum(["general", "technical", "professional", "medical"]),
    courseYear: z.number().int().min(1).max(6),
    institutionType: z.enum(["government", "aided", "private"]),
    marksPercentage: z.number().min(0).max(100),
    classXIIPercentile: z.number().min(0).max(100),
    graduationPercentage: z.number().min(0).max(100),
    hostelResident: z.boolean(),
    isOrphan: z.boolean(),
    parentOccupation: z.enum([
      "daily_wage",
      "farmer",
      "self_employed",
      "salaried",
      "hazardous_work",
      "other",
    ]),
    plansStudyAbroad: z.boolean(),
    hasForeignAdmission: z.boolean(),

    isDisabled: z.boolean(),
    disabilityPercent: z.number().min(0).max(100),
    chronicCondition: z.enum([
      "dialysis",
      "thalassemia",
      "sickle_cell",
      "haemophilia",
      "filaria",
      "none",
    ]),
    isOnART: z.boolean(),

    landAcres: z.number().min(0),
    isPattadar: z.boolean(),
    hasMgnregsJobCard: z.boolean(),
    isShgMember: z.boolean(),

    ownsPuccaHouse: z.boolean(),
    hasDomesticElectricity: z.boolean(),
    monthlyElectricityUnits: z.number().int().min(0),
    hasLpgInOwnName: z.boolean(),
    householdHasLpg: z.boolean(),
    daughterMarriagePlanned: z.boolean(),

    isIncomeTaxPayer: z.boolean(),
    isGovtEmployeeFamily: z.boolean(),
    receivesPension: z.boolean(),
    wantsToStartBusiness: z.boolean(),
  })
  .partial();

export type Profile = z.infer<typeof profileSchema>;
export type ProfileField = keyof Profile;
