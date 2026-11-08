import type { Benefit } from "@/types";

/**
 * VETERAN BENEFITS — PROTOTYPE DATASET
 *
 * Every record points at a real, official program page, but the summaries,
 * eligibility bullets and application steps were written for this prototype and
 * have NOT been reviewed line-by-line against the official source. They are
 * therefore all `dataStatus: "demo"` and the UI says so on every record.
 *
 * Rules for editing this file:
 *  - Never state dollar amounts, percentages or deadlines that are not on the
 *    official page. Prefer "amount varies — see official source".
 *  - Only change a record to `dataStatus: "verified"` after a person has
 *    checked it against `sourceUrl` and set `lastVerified`.
 *  - Federal programs use `state: null`; state programs use a 2-letter USPS code.
 *  - Some state agency sites block automated checks; where a deep link could not
 *    be confirmed we link to the agency home page instead of guessing a path.
 */
type Seed = Omit<Benefit, "id" | "dataStatus" | "lastVerified" | "scope" | "state"> & { state?: string };

const seeds: Seed[] = [
  // ───────────────────────── Federal ─────────────────────────
  {
    slug: "post-9-11-gi-bill",
    title: "Post-9/11 GI Bill",
    category: "education",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Help paying for school or training, including tuition, housing and books, for those who served on active duty after September 10, 2001.",
    description:
      "The Post-9/11 GI Bill is a VA education benefit for Veterans and service members with qualifying active-duty service. It can help cover tuition and fees at approved schools, a monthly housing allowance, and a books and supplies stipend. The amount of benefit depends on the length of your qualifying service and the school you attend.",
    eligibility: [
      "Qualifying active-duty service on or after September 11, 2001 (minimum length of service applies)",
      "Discharge that is not dishonorable; some service-connected disability discharges also qualify",
      "Benefit percentage depends on how much qualifying service you have",
    ],
    howToApply: [
      "Review the eligibility rules on VA.gov.",
      "Apply for education benefits online through VA.gov.",
      "Give your Certificate of Eligibility to your school's VA certifying official.",
    ],
    sourceUrl: "https://www.va.gov/education/about-gi-bill-benefits/post-9-11/",
    applyUrl: "https://www.va.gov/education/how-to-apply/",
    tags: ["gi bill", "tuition", "college", "school", "housing allowance", "books"],
  },
  {
    slug: "survivors-dependents-education-assistance",
    title: "Survivors' and Dependents' Education Assistance",
    category: "education",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Education and training benefits for certain spouses and children of Veterans who died or have a severe service-connected disability.",
    description:
      "VA offers education and career benefits to eligible family members of Veterans who died in service or from a service-connected condition, or who are permanently and totally disabled because of service. The VA site lists the specific programs (such as the Dependents' Educational Assistance program) and who qualifies for each.",
    eligibility: [
      "Spouse or child of a Veteran or service member who meets VA's survivor or disability criteria",
      "Specific programs have their own age, relationship and time-limit rules",
    ],
    howToApply: [
      "Read the family-member education programs on VA.gov to find the one that fits.",
      "Complete the application listed for that program.",
      "Contact your school's VA certifying official once approved.",
    ],
    sourceUrl: "https://www.va.gov/family-and-caregiver-benefits/education-and-careers/",
    tags: ["dependents", "survivors", "spouse", "children", "family", "tuition"],
  },
  {
    slug: "va-health-care",
    title: "VA Health Care",
    category: "healthcare",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Primary care, specialty care, prescriptions and more through VA medical centers and clinics.",
    description:
      "VA health care covers a range of services, including preventive care, primary and specialty care, mental health, and prescriptions. Whether you qualify, and what you may pay, depends on your service history, disability rating, income and other factors. VA assigns enrolled Veterans a priority group.",
    eligibility: [
      "Generally, served in the active military and did not receive a dishonorable discharge",
      "Minimum-service rules can apply depending on when you served",
      "Priority group and any copays depend on your circumstances",
    ],
    howToApply: [
      "Check your eligibility on VA.gov.",
      "Apply online, by phone, by mail or in person at a VA health facility.",
      "Once enrolled, schedule your first appointment with your local VA facility.",
    ],
    sourceUrl: "https://www.va.gov/health-care/",
    applyUrl: "https://www.va.gov/forms/10-10ez/apply-va-healthcare/",
    tags: ["medical", "clinic", "hospital", "prescriptions", "enrollment"],
  },
  {
    slug: "va-mental-health-services",
    title: "VA Mental Health Services",
    category: "healthcare",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Counseling and treatment for PTSD, depression, anxiety, substance use and other mental health concerns.",
    description:
      "VA provides mental health care in person, by phone and by video. Services include individual and group therapy, medication management and specialized PTSD and substance-use programs. Vet Centers also offer readjustment counseling to many Veterans and family members.",
    eligibility: [
      "Eligibility depends on your service and VA health care enrollment",
      "Some counseling services are available outside standard VA enrollment — check the VA site",
    ],
    howToApply: [
      "Review the mental health services described on VA.gov.",
      "Contact your local VA medical center or Vet Center, or enroll in VA health care.",
    ],
    sourceUrl: "https://www.va.gov/health-care/health-needs-conditions/mental-health/",
    tags: ["ptsd", "counseling", "therapy", "depression", "anxiety", "substance use", "vet center"],
  },
  {
    slug: "veterans-crisis-line",
    title: "Veterans Crisis Line",
    category: "healthcare",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Free, confidential, 24/7 support for Veterans in crisis and their families and friends.",
    description:
      "Trained responders are available any time, day or night. You do not need to be enrolled in VA benefits or health care to use the Veterans Crisis Line. If you or someone you know is in immediate danger, call 911.",
    eligibility: [
      "Veterans, service members, National Guard and Reserve members, and their family and friends",
      "No VA enrollment required",
    ],
    howToApply: [
      "Dial 988, then press 1.",
      "Or text 838255, or chat online at VeteransCrisisLine.net.",
    ],
    sourceUrl: "https://www.veteranscrisisline.net/",
    tags: ["crisis", "suicide prevention", "988", "hotline", "emergency", "mental health"],
  },
  {
    slug: "va-disability-compensation",
    title: "VA Disability Compensation",
    category: "disability",
    agency: "U.S. Department of Veterans Affairs",
    summary: "A monthly tax-free payment for Veterans with a disability connected to their military service.",
    description:
      "Disability compensation is paid to Veterans who got sick or injured while serving, or whose condition was made worse by service. VA assigns a disability rating that determines the payment amount. Ratings and payment rates are published on VA.gov and updated periodically.",
    eligibility: [
      "A current physical or mental health condition",
      "An event, injury or illness during service (or a condition service made worse) connected to it",
      "A discharge that is not dishonorable",
    ],
    howToApply: [
      "Gather medical evidence and service records.",
      "File a claim online, by mail, in person or with the help of an accredited representative.",
      "Attend any VA claim exams you are scheduled for.",
    ],
    sourceUrl: "https://www.va.gov/disability/",
    applyUrl: "https://www.va.gov/disability/how-to-file-claim/",
    tags: ["compensation", "rating", "claim", "service-connected", "monthly payment"],
  },
  {
    slug: "special-monthly-compensation",
    title: "Special Monthly Compensation",
    category: "disability",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Additional compensation for Veterans with certain severe disabilities, such as loss of limb use or the need for daily assistance.",
    description:
      "Special Monthly Compensation (SMC) is paid on top of, or instead of, standard disability compensation for specific severe conditions. VA publishes the SMC categories and rates on VA.gov.",
    eligibility: [
      "Service-connected disability that meets one of VA's SMC categories",
      "Categories are specific — review them on the official page",
    ],
    howToApply: [
      "Review the SMC categories on VA.gov.",
      "File or update a disability claim and ask VA to consider SMC.",
    ],
    sourceUrl: "https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/",
    applyUrl: "https://www.va.gov/disability/how-to-file-claim/",
    tags: ["smc", "severe disability", "aid and attendance", "housebound"],
  },
  {
    slug: "caregiver-support-program",
    title: "VA Caregiver Support Program",
    category: "disability",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Support, training and, for some families, a monthly stipend for those who care for a seriously injured or ill Veteran.",
    description:
      "VA offers caregiver programs, including a comprehensive family caregiver program with additional benefits and a general program with education and support. Which one applies depends on the Veteran's condition and care needs.",
    eligibility: [
      "The Veteran has a service-connected condition and needs personal care services",
      "The comprehensive program has additional disability-rating and care-need requirements — see the official page",
    ],
    howToApply: [
      "Read about both caregiver programs at caregiver.va.gov.",
      "Contact the Caregiver Support Program at your local VA medical center.",
    ],
    sourceUrl: "https://www.caregiver.va.gov/",
    tags: ["caregiver", "family", "stipend", "respite", "support"],
  },
  {
    slug: "va-home-loan-guaranty",
    title: "VA Home Loan Guaranty",
    category: "housing",
    agency: "U.S. Department of Veterans Affairs",
    summary: "A VA-backed home loan that can help eligible Veterans, service members and some surviving spouses buy, build, repair or refinance a home.",
    description:
      "VA guarantees part of a loan made by a private lender, which can allow competitive terms and, in many cases, no down payment. You still need to meet the lender's credit and income requirements, and VA sets rules on occupancy and property standards.",
    eligibility: [
      "Meet VA's length-of-service requirements for your service era",
      "Discharge that is not dishonorable",
      "A Certificate of Eligibility (COE) from VA",
      "Meet the lender's credit and income requirements",
    ],
    howToApply: [
      "Request your Certificate of Eligibility from VA.",
      "Compare offers from VA-approved lenders.",
      "Choose a property and complete the loan process with your lender.",
    ],
    sourceUrl: "https://www.va.gov/housing-assistance/home-loans/",
    applyUrl: "https://www.va.gov/housing-assistance/home-loans/how-to-request-coe/",
    tags: ["mortgage", "home loan", "va loan", "coe", "refinance", "buy a home"],
  },
  {
    slug: "specially-adapted-housing-grants",
    title: "Specially Adapted Housing Grants",
    category: "housing",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Grants to modify or buy a home that fits the needs of a Veteran with certain severe service-connected disabilities.",
    description:
      "VA offers several disability housing grants for eligible Veterans and service members, including grants for adapting a home and for temporary housing adaptations. Each grant has its own disability criteria and limits.",
    eligibility: [
      "Own, or will own, the home (some grants have temporary-housing options)",
      "Qualifying severe service-connected disability — criteria are listed per grant on VA.gov",
    ],
    howToApply: [
      "Review the grant types on VA.gov.",
      "Apply through VA using the instructions for the grant that fits.",
    ],
    sourceUrl: "https://www.va.gov/housing-assistance/disability-housing-grants/",
    tags: ["sah", "sha", "adapted housing", "accessibility", "grant", "modification"],
  },
  {
    slug: "hud-vash",
    title: "HUD-VASH Supportive Housing",
    category: "housing",
    agency: "U.S. Department of Veterans Affairs / HUD",
    summary: "Rental assistance vouchers combined with VA case management and clinical services for Veterans experiencing homelessness.",
    description:
      "The HUD-VA Supportive Housing program pairs HUD Housing Choice Vouchers with VA supportive services. Referrals typically come through a local VA medical center or homeless program.",
    eligibility: [
      "Veterans who are experiencing homelessness",
      "Generally eligible for VA health care; local program rules apply",
    ],
    howToApply: [
      "Contact your local VA homeless program or call the National Call Center for Homeless Veterans at 1-877-424-3838.",
      "Complete a VA assessment and referral.",
    ],
    sourceUrl: "https://department.va.gov/homeless/hud-vash/",
    tags: ["homeless", "voucher", "rental assistance", "case management", "section 8"],
  },
  {
    slug: "supportive-services-for-veteran-families",
    title: "Supportive Services for Veteran Families (SSVF)",
    category: "housing",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Community-based help for very low-income Veteran families who are homeless or at risk of losing their housing.",
    description:
      "VA funds local nonprofit organizations that provide services such as case management and help finding or keeping housing. Services and eligibility screening are delivered by the local grantee in your area.",
    eligibility: [
      "Veteran families with very low income",
      "Currently homeless, or at risk of becoming homeless",
    ],
    howToApply: [
      "Find an SSVF provider near you through the VA site, or call 1-877-424-3838.",
      "Complete the provider's eligibility screening.",
    ],
    sourceUrl: "https://department.va.gov/homeless/supportive-services-for-veteran-families/",
    tags: ["homeless", "eviction", "rent", "rapid rehousing", "prevention"],
  },
  {
    slug: "veteran-readiness-and-employment",
    title: "Veteran Readiness and Employment (VR&E)",
    category: "employment",
    agency: "U.S. Department of Veterans Affairs",
    summary: "Job training, employment accommodations, resume help and independent-living services for Veterans with service-connected disabilities.",
    description:
      "VR&E, also known as Chapter 31, helps eligible Veterans prepare for, find and keep suitable work, or live more independently. A VR&E counselor works with you to build a plan.",
    eligibility: [
      "Generally a service-connected disability rating plus an employment barrier",
      "A discharge that is not dishonorable",
      "Time limits can apply — confirm on VA.gov",
    ],
    howToApply: [
      "Review eligibility on VA.gov.",
      "Apply online, then meet with a VR&E counselor for an evaluation.",
    ],
    sourceUrl: "https://www.va.gov/careers-employment/vocational-rehabilitation/",
    tags: ["chapter 31", "vocational", "job training", "career", "rehabilitation"],
  },
  {
    slug: "federal-veterans-preference",
    title: "Veterans' Preference in Federal Hiring",
    category: "employment",
    agency: "U.S. Office of Personnel Management",
    summary: "Eligible veterans receive preference over many other applicants when applying for federal jobs.",
    description:
      "Veterans' preference gives eligible veterans an advantage in federal hiring and in some layoffs. OPM publishes the preference categories and the documents (such as your DD-214) you may need to provide.",
    eligibility: [
      "Honorable or general discharge",
      "Service during qualifying periods or campaigns, or a service-connected disability — see OPM's categories",
    ],
    howToApply: [
      "Read OPM's veterans' preference guidance.",
      "Claim preference on your federal job application and attach the required documents.",
    ],
    sourceUrl: "https://www.opm.gov/fedshirevets/",
    tags: ["federal jobs", "usajobs", "hiring", "dd-214", "preference"],
  },
  {
    slug: "sba-veteran-business-programs",
    title: "SBA Veteran Business Resources",
    category: "employment",
    agency: "U.S. Small Business Administration",
    summary: "Counseling, training, financing and contracting resources for veteran entrepreneurs and business owners.",
    description:
      "The Small Business Administration lists programs aimed at veterans, military spouses and service-disabled veteran-owned businesses, including training, counseling and contracting assistance. Program names and availability change, so use the SBA page for current options.",
    eligibility: [
      "Varies by program — veterans, service-disabled veterans and some military spouses",
      "Each program lists its own requirements",
    ],
    howToApply: [
      "Browse the SBA veteran resources.",
      "Contact the program or local SBA resource partner listed for the one you want.",
    ],
    sourceUrl: "https://www.sba.gov/counseling/grow-your-business/#veteran-owned",
    tags: ["small business", "entrepreneur", "sdvosb", "contracting", "startup", "loans"],
  },
  {
    slug: "va-pension",
    title: "VA Pension",
    category: "financial",
    agency: "U.S. Department of Veterans Affairs",
    summary: "A monthly benefit for wartime Veterans with limited income who are age 65 or older or have a qualifying disability.",
    description:
      "The Veterans Pension is a needs-based benefit. VA considers your income and net worth, and some pensioners may qualify for additional amounts such as Aid and Attendance or Housebound allowances.",
    eligibility: [
      "Qualifying wartime service and a discharge that is not dishonorable",
      "Age 65 or older, or a qualifying disability",
      "Income and net worth within VA limits",
    ],
    howToApply: [
      "Review eligibility on VA.gov.",
      "Apply online, by mail or with an accredited representative.",
    ],
    sourceUrl: "https://www.va.gov/pension/",
    tags: ["pension", "income", "aid and attendance", "housebound", "low income"],
  },
  {
    slug: "dependency-and-indemnity-compensation",
    title: "Dependency and Indemnity Compensation (DIC)",
    category: "financial",
    agency: "U.S. Department of Veterans Affairs",
    summary: "A monthly payment to eligible survivors of service members who died in the line of duty or Veterans who died from a service-connected condition.",
    description:
      "DIC is paid to certain surviving spouses, children and parents. VA's survivor compensation pages explain who qualifies and how to apply.",
    eligibility: [
      "Surviving spouse, child or parent who meets VA's relationship and circumstance rules",
      "The service member or Veteran's death must meet VA's criteria",
    ],
    howToApply: [
      "Review the survivor compensation page on VA.gov.",
      "Apply online, by mail or with an accredited representative.",
    ],
    sourceUrl: "https://www.va.gov/family-and-caregiver-benefits/survivor-compensation/",
    tags: ["dic", "survivor", "surviving spouse", "death benefit", "gold star"],
  },
  {
    slug: "federal-tax-treatment-of-va-benefits",
    title: "Federal Tax Treatment of VA Benefits",
    category: "tax",
    agency: "Internal Revenue Service",
    summary: "Many VA payments, such as disability compensation, are generally not counted as taxable federal income.",
    description:
      "IRS Publication 525 explains which veterans' payments are excluded from gross income. This is not an application-based program, and other income you receive may still be taxable. Talk to a qualified tax professional about your situation.",
    eligibility: [
      "Applies to qualifying payments received from VA — see IRS Publication 525 for the list",
      "Other income (for example, some retirement pay) may be taxable",
    ],
    howToApply: [
      "No application is required.",
      "Read the veterans' benefits section of IRS Publication 525, or consult a tax professional.",
    ],
    sourceUrl: "https://www.irs.gov/publications/p525",
    tags: ["taxes", "irs", "tax-free", "non-taxable", "income tax"],
  },

  // ───────────────────────── State programs ─────────────────────────
  {
    slug: "texas-hazlewood-act",
    state: "TX",
    title: "Texas Hazlewood Act",
    category: "education",
    agency: "Texas Veterans Commission",
    summary: "Tuition exemption at Texas public colleges and universities for eligible Texas veterans, with a possible transfer option for children.",
    description:
      "The Hazlewood Act provides a limited number of tuition-exempt credit hours at Texas public institutions of higher education for eligible veterans, and in some cases their spouses and children. Rules about residency, service and use of other benefits apply.",
    eligibility: [
      "Texas residency requirements tied to when you entered service or your home of record",
      "Honorable discharge and a minimum length of active-duty service",
      "Other federal education benefits may need to be used first",
    ],
    howToApply: [
      "Read the Hazlewood requirements on the Texas Veterans Commission site.",
      "Submit an application to the financial aid or veterans office of your Texas school.",
    ],
    sourceUrl: "https://www.tvc.texas.gov/education/hazlewood-act/",
    tags: ["tuition", "college", "exemption", "dependents", "university"],
  },
  {
    slug: "texas-disabled-veteran-property-tax-exemption",
    state: "TX",
    title: "Texas Disabled Veteran Property Tax Exemption",
    category: "tax",
    agency: "Texas Comptroller of Public Accounts",
    summary: "Property tax exemptions for veterans with a service-connected disability rating, with larger exemptions at higher ratings.",
    description:
      "Texas offers property tax exemptions to qualifying disabled veterans. The size of the exemption depends on the VA disability rating, and veterans at the highest rating may qualify for a broader homestead exemption. Applications go to your local appraisal district.",
    eligibility: [
      "Service-connected disability rating from VA (or the military)",
      "Property ownership requirements apply",
      "Exemption amount depends on your rating",
    ],
    howToApply: [
      "Review the exemption on the Texas Comptroller's site.",
      "Apply through your county appraisal district with your VA rating letter.",
    ],
    sourceUrl: "https://comptroller.texas.gov/taxes/property-tax/exemptions/",
    tags: ["property tax", "homestead", "appraisal district", "disabled veteran"],
  },
  {
    slug: "texas-veterans-land-board-programs",
    state: "TX",
    title: "Texas Veterans Land Board Loan Programs",
    category: "housing",
    agency: "Texas General Land Office — Veterans Land Board",
    summary: "State-backed home, land and home-improvement loan programs for eligible Texas veterans.",
    description:
      "The Veterans Land Board offers home and land loan programs for eligible Texas veterans. Terms, rates and eligibility are set by the Board and change over time.",
    eligibility: [
      "Texas residents with qualifying military service",
      "Program-specific requirements apply — see the official page",
    ],
    howToApply: [
      "Review the programs on the Texas GLO veterans page.",
      "Contact the Veterans Land Board or an approved lender to start an application.",
    ],
    sourceUrl: "https://www.glo.texas.gov/veterans",
    tags: ["home loan", "land", "mortgage", "home improvement"],
  },
  {
    slug: "california-calvet-home-loans",
    state: "CA",
    title: "CalVet Home Loans",
    category: "housing",
    agency: "California Department of Veterans Affairs",
    summary: "California's veteran home loan program, where CalVet acts as the lender. It is separate from the federal VA loan guaranty.",
    description:
      "CalVet Home Loans are state-run loans for eligible California veterans buying an owner-occupied home in California. Check the agency site for current terms, property types and eligibility.",
    eligibility: [
      "Veteran buying an owner-occupied home in California",
      "Additional program requirements apply — see CalVet",
    ],
    howToApply: [
      "Visit the California Department of Veterans Affairs site and open the Home Loans section.",
      "Contact CalVet to start an application.",
    ],
    sourceUrl: "https://www.calvet.ca.gov/",
    tags: ["home loan", "mortgage", "buy a home", "calvet"],
  },
  {
    slug: "california-college-fee-waiver",
    state: "CA",
    title: "California College Fee Waiver for Veteran Dependents",
    category: "education",
    agency: "California Department of Veterans Affairs",
    summary: "A waiver of mandatory system-wide tuition and fees at California public colleges for certain dependents of disabled or deceased veterans.",
    description:
      "The College Fee Waiver applies at California Community Colleges, California State University and University of California campuses. It is administered through county Veterans Service Offices and approved by CalVet. Coverage details differ by plan and campus.",
    eligibility: [
      "Dependent (spouse, child or unmarried surviving spouse) of a qualifying veteran",
      "Veteran's service-connected disability or death must meet California's criteria",
      "Some plans have income limits",
    ],
    howToApply: [
      "Contact your county Veterans Service Office.",
      "Submit the application with proof of relationship and the veteran's VA award letter.",
      "Give the approval to your school's financial aid or veterans office.",
    ],
    sourceUrl: "https://www.calvet.ca.gov/",
    tags: ["tuition", "fee waiver", "dependents", "community college", "csu", "uc"],
  },
  {
    slug: "california-disabled-veterans-property-tax-exemption",
    state: "CA",
    title: "California Disabled Veterans' Property Tax Exemption",
    category: "tax",
    agency: "California State Board of Equalization / County Assessors",
    summary: "A property tax exemption on the principal residence of certain disabled veterans or their unmarried surviving spouses.",
    description:
      "Claims are filed with the county assessor where the property is located. Exemption amounts are adjusted over time and the rules have been changing, so use the Board of Equalization or your county assessor for current figures.",
    eligibility: [
      "Principal residence of a qualifying disabled veteran or unmarried surviving spouse",
      "Disability criteria set by California law — see the official source",
    ],
    howToApply: [
      "Get the claim form from the State Board of Equalization or your county assessor.",
      "File the claim with the county assessor with proof of your VA disability status.",
    ],
    sourceUrl: "https://www.boe.ca.gov/proptaxes/",
    tags: ["property tax", "assessor", "homeowner", "disabled veteran", "surviving spouse"],
  },
  {
    slug: "florida-disabled-veteran-homestead-exemption",
    state: "FL",
    title: "Florida Total & Permanent Disability Homestead Exemption",
    category: "tax",
    agency: "Florida county property appraisers",
    summary: "A homestead property tax exemption for veterans who are totally and permanently disabled from a service-connected cause.",
    description:
      "Florida law provides an exemption from property taxes on the homestead of a veteran who is totally and permanently disabled because of service. The exemption may continue for a surviving spouse in certain cases. Claims are filed with your county property appraiser.",
    eligibility: [
      "Veteran is a Florida homestead owner and resident",
      "Total and permanent service-connected disability documented by VA or another federal agency",
      "Surviving spouse provisions may apply",
    ],
    howToApply: [
      "Contact your county property appraiser's office.",
      "File an exemption application with proof of disability from VA, as instructed locally.",
    ],
    sourceUrl: "https://www.flsenate.gov/Laws/Statutes/2024/196.081",
    tags: ["property tax", "homestead", "total and permanent", "surviving spouse"],
  },
  {
    slug: "virginia-vmsdep",
    state: "VA",
    title: "Virginia Military Survivors and Dependents Education Program (VMSDEP)",
    category: "education",
    agency: "Virginia Department of Veterans Services",
    summary: "Tuition and fee waivers at Virginia public colleges for qualifying spouses and children of certain service members and veterans.",
    description:
      "VMSDEP is administered by the Virginia Department of Veterans Services with the State Council of Higher Education for Virginia and participating public schools. Eligibility is confirmed by DVS, and there are different tiers of eligibility.",
    eligibility: [
      "Spouse or child of a service member or veteran who meets Virginia's criteria (for example, died, missing, prisoner of war, or severely service-disabled)",
      "Virginia residency and school requirements apply",
    ],
    howToApply: [
      "Review the VMSDEP page and FAQ on the Virginia DVS site.",
      "Apply to DVS for an eligibility determination.",
      "Provide the determination to your Virginia public school.",
    ],
    sourceUrl: "https://www.dvs.virginia.gov/",
    tags: ["tuition", "waiver", "dependents", "survivors", "college"],
  },
  {
    slug: "virginia-100-percent-disabled-veteran-real-estate-tax-exemption",
    state: "VA",
    title: "Virginia Real Estate Tax Exemption for Disabled Veterans",
    category: "tax",
    agency: "Virginia localities / Virginia Department of Veterans Services",
    summary: "Exemption from real estate tax on a primary residence for veterans with a 100% permanent and total service-connected disability.",
    description:
      "Virginia allows an exemption on a veteran's principal place of residence if the veteran has a 100% service-connected, permanent and total disability. The exemption is administered by your locality, so confirm the process with your local commissioner of the revenue or assessor.",
    eligibility: [
      "100% permanent and total service-connected disability from VA",
      "The property is the veteran's principal place of residence",
    ],
    howToApply: [
      "Contact your local commissioner of the revenue or real estate assessor's office.",
      "File the local exemption application with your VA rating documentation.",
    ],
    sourceUrl: "https://www.dvs.virginia.gov/",
    tags: ["real estate tax", "property tax", "disabled veteran", "homeowner"],
  },
  {
    slug: "north-carolina-wartime-veterans-scholarship",
    state: "NC",
    title: "North Carolina Scholarship for Children of Wartime Veterans",
    category: "education",
    agency: "North Carolina Department of Military and Veterans Affairs",
    summary: "Scholarship help for certain children of North Carolina wartime veterans at state schools.",
    description:
      "North Carolina offers a scholarship program for children of certain wartime veterans, for example those who were killed, disabled or held as prisoners of war because of wartime service. Applicants and veterans must meet state requirements.",
    eligibility: [
      "Child of a qualifying wartime veteran",
      "Veteran or applicant meets North Carolina residency requirements",
      "Veteran's service status must meet the state's criteria",
    ],
    howToApply: [
      "Start at the NC Department of Military and Veterans Affairs site.",
      "Submit the scholarship application and veteran documentation.",
    ],
    sourceUrl: "https://www.milvets.nc.gov/",
    tags: ["scholarship", "children", "wartime veterans", "tuition"],
  },
  {
    slug: "north-carolina-disabled-veteran-homestead-exclusion",
    state: "NC",
    title: "North Carolina Disabled Veteran Homestead Exclusion",
    category: "tax",
    agency: "North Carolina Department of Revenue / county tax offices",
    summary: "A property tax exclusion on the permanent residence of qualifying disabled veterans or their surviving spouses.",
    description:
      "North Carolina excludes part of the assessed value of a qualifying veteran's permanent residence from property taxes. Applications are made through your county tax office.",
    eligibility: [
      "Veteran with a total and permanent service-connected disability (or an eligible surviving spouse)",
      "The property is the permanent residence",
    ],
    howToApply: [
      "Contact your county tax assessor's office.",
      "File the application with documentation of your VA disability status.",
    ],
    sourceUrl: "https://www.ncdor.gov/taxes-forms/property-tax",
    tags: ["property tax", "homestead", "exclusion", "disabled veteran"],
  },
  {
    slug: "new-york-veterans-tuition-awards",
    state: "NY",
    title: "New York Veterans Tuition Awards (VTA)",
    category: "education",
    agency: "New York State Higher Education Services Corporation",
    summary: "Tuition awards for eligible New York veterans enrolled in approved programs at New York schools.",
    description:
      "VTA is a New York State award for qualifying veterans attending approved programs in the state. Award levels and requirements are set by HESC.",
    eligibility: [
      "Veteran who served in qualifying periods of hostilities",
      "New York residency and enrollment requirements apply",
      "Discharge other than dishonorable",
    ],
    howToApply: [
      "Review VTA requirements on the HESC site.",
      "Apply through HESC and submit your discharge documentation.",
    ],
    sourceUrl: "https://hesc.ny.gov/vta",
    tags: ["tuition", "award", "college", "graduate", "hesc"],
  },
  {
    slug: "colorado-disabled-veteran-property-tax-exemption",
    state: "CO",
    title: "Colorado Disabled Veteran Property Tax Exemption",
    category: "tax",
    agency: "Colorado Division of Veterans Affairs / county assessors",
    summary: "A property tax exemption on a portion of the value of the primary residence for qualifying disabled veterans.",
    description:
      "Colorado exempts part of the actual value of the primary residence of eligible disabled veterans. The application process has changed in recent years, so confirm current steps with the Division of Veterans Affairs and your county assessor.",
    eligibility: [
      "Veteran with a qualifying service-connected disability rating",
      "The property is the veteran's primary residence",
    ],
    howToApply: [
      "Check current instructions with the Colorado Division of Veterans Affairs.",
      "Submit the required application and VA documentation.",
    ],
    sourceUrl: "https://vets.colorado.gov/",
    tags: ["property tax", "exemption", "primary residence", "disabled veteran"],
  },
];

export const benefits: Benefit[] = seeds.map((s, i) => ({
  ...s,
  id: `ben_${String(i + 1).padStart(3, "0")}`,
  scope: s.state ? "state" : "federal",
  state: s.state ?? null,
  dataStatus: "demo",
}));
