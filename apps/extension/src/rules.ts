import type { Rules } from "@form-filler/shared";

export const RULES: Rules = {
  firstName: { value: "John", matchers: ["first name"] },
  lastName: { value: "Gray", matchers: ["last name", "family name"] },
  fullName: { value: "John Gray", matchers: ["full name", "name"] },
  title: { value: "Software Engineer", matchers: ["title"] },

  city: { value: "Bronxville", matchers: ["city"] },
  state: { value: "NY", matchers: ["state"] },
  country: { value: "United States", matchers: ["country"] },
  currentLocation: {
    value: "7 Tanglewylde Ave, Bronxville, NY 10708",
    matchers: ["current location"],
  },

  phoneNumber: { value: "9146724526", matchers: ["phone", "number"] },
  email: { value: "johngraydev@gmail.com", matchers: ["email"] },
  linkedIn: {
    value: "https://www.linkedin.com/in/john-thomas-gray/",
    matchers: ["linkedin", "linkedin profile"],
  },
  github: {
    value: "https://github.com/john-thomas-gray",
    matchers: ["github"],
  },
  portfolio: {
    value: "johngraydev.com",
    matchers: ["portfolio", "website"],
  },
  otherWebsite: {
    value: "wadjet.com",
    matchers: ["other website"],
  },
  currentCompany: {
    value: "Wadjet LLC",
    matchers: ["current company", "current employer", "employer"],
  },

  education: {
    value: "4-year college degree",
    matchers: ["education", "highest level of education"],
  },
  school: {
    value: "College of the Holy Cross",
    matchers: ["school", "university", "college", "undergraduate"],
  },
  degree: { value: "Bachelor's Degree", matchers: ["degree"] },
  discipline: { value: "English", matchers: ["discipline"] },
  startDateMonth: {
    value: "September",
    matchers: ["start date month", "start date"],
  },
  endDateMonth: {
    value: "May",
    matchers: ["end date month", "end date"],
  },
  startDateYear: {
    value: "2012",
    matchers: ["start date year", "start date"],
  },
  endDateYear: {
    value: "2015",
    matchers: ["end date year", "end date"],
  },

  inOffice: {
    value: "Yes",
    matchers: ["Are you able to work out of", "days per week?"],
  },
  referral: {
    value: "LinkedIn",
    matchers: ["How did you hear about", "referral", "who referred you"],
  },

  visa: {
    value: "No",
    matchers: [
      "Will you now or in the future require",
      "visa status",
      "visa",
      "work in the united states",
    ],
  },
  gender: {
    value: "Male",
    matchers: ["gender", "gender identity", "sex assigned"],
  },
  sexualOrientation: {
    value: "Queer",
    matchers: [
      "sexual orientation",
      "orientation",
      "sexuality",
      "sexual",
      "lgbt",
    ],
  },
  pronouns: {
    value: "He/Him",
    matchers: ["pronouns, He/Him"],
    strategy: "checkbox",
  },
  disability: {
    value: "No",
    matchers: ["disability status", "disability"],
  },
  physical: {
    value: "I identify as able-bodied",
    matchers: ["physical ability", "ability", "physical"],
  },
  veteran: {
    value: "I am not a protected veteran",
    matchers: ["veteran status", "veteran", "protected veteran"],
  },
  hispanic: { value: "No", matchers: ["hispanic", "latino"] },
  race: { value: "White", matchers: ["race", "ethnicity", "racial", "ethnic"] },
  caregiver: {
    value: "No",
    matchers: ["caregiver", "caregiver status", "do you provide regular cares"],
  },
  family: { value: "No Children", matchers: ["Family", "family status"] },
  mentalHealth: {
    value: "No",
    matchers: ["mental health", "mental health condition"],
  },
  pledge: { value: "I acknowledge", matchers: ["pledge"] },
  confirmarion: {
    value: "I confirm",
    matchers: ["I confirm I have reviewed", "I confirm"],
  },
  confirm: {
    value: "Confirmed",
    matchers: ["Please confirm"],
  },
  understand: {
    value: "Yes",
    matchers: ["I understand"],
  },
  nepotism: {
    value: "No",
    matchers: [
      "close relative",
      "government official",
      "currently hold a role",
      "close personal relationship",
    ],
  },
  experience: {
    value: "3",
    matchers: ["How many years", "professional experience do you have"],
  },
  eighteen: {
    value: "Yes",
    matchers: ["Are you at least", "years of age", "years old"],
  },
  employed: { value: "No", matchers: ["have you previously been"] },
  countryAuthorized: {
    value: "Yes",
    matchers: ["are you legally authorized", "this position is located"],
  },
  hybrid: {
    value: "Yes",
    matchers: ["working hybrid", "hybrid", "days a week"],
  },
  accomodations: {
    value: "No",
    matchers: ["accomodations", "do you require"],
  },
  relocate: {
    value: "Yes",
    matchers: ["relocate", "office location"],
  },
  workInUs: {
    value: "Yes",
    matchers: [
      "are you based",
      "work from the united states",
      "work in the united states",
    ],
  },
  where: {
    value: "New York",
    matchers: ["where are you based"],
  },
  repo: {
    value: "",
    matchers: ["repository name"],
  },
  username: {
    value: "dondecanseco",
    matchers: ["username"],
  },
};
