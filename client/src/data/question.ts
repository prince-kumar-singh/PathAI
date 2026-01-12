// Correct Option Labels (NO NUMBERS)
const OPTION_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree"
];

// Create options: value 1–5, label only text
const makeOptions = () =>
  [1, 2, 3, 4, 5].map((value) => ({
    value,
    label: OPTION_LABELS[value - 1]   // Label does NOT contain numbers now
  }));


// ========================
// Full MCQ DATA
// ========================

const mcqData = [
  { id: "EXT1", trait: "Extroversion", question: "I am the life of the party.", options: makeOptions() },
  { id: "EXT2", trait: "Extroversion", question: "I don't talk a lot.", options: makeOptions() },
  { id: "EXT3", trait: "Extroversion", question: "I feel comfortable around people.", options: makeOptions() },
  { id: "EXT4", trait: "Extroversion", question: "I keep in the background.", options: makeOptions() },
  { id: "EXT5", trait: "Extroversion", question: "I start conversations.", options: makeOptions() },
  { id: "EXT6", trait: "Extroversion", question: "I have little to say.", options: makeOptions() },
  { id: "EXT7", trait: "Extroversion", question: "I talk to a lot of different people at parties.", options: makeOptions() },
  { id: "EXT8", trait: "Extroversion", question: "I don't like to draw attention to myself.", options: makeOptions() },
  { id: "EXT9", trait: "Extroversion", question: "I don't mind being the center of attention.", options: makeOptions() },
  { id: "EXT10", trait: "Extroversion", question: "I am quiet around strangers.", options: makeOptions() },

  // Neuroticism
  ...[
    "I get stressed out easily.",
    "I am relaxed most of the time.",
    "I worry about things.",
    "I seldom feel blue.",
    "I am easily disturbed.",
    "I get upset easily.",
    "I change my mood a lot.",
    "I have frequent mood swings.",
    "I get irritated easily.",
    "I often feel blue."
  ].map((q, i) => ({
    id: `EST${i + 1}`,
    trait: "Neuroticism",
    question: q,
    options: makeOptions()
  })),

  // Agreeableness
  ...[
    "I feel little concern for others.",
    "I am interested in people.",
    "I insult people.",
    "I sympathize with others' feelings.",
    "I am not interested in other people's problems.",
    "I have a soft heart.",
    "I am not really interested in others.",
    "I take time out for others.",
    "I feel others' emotions.",
    "I make people feel at ease."
  ].map((q, i) => ({
    id: `AGR${i + 1}`,
    trait: "Agreeableness",
    question: q,
    options: makeOptions()
  })),

  // Conscientiousness
  ...[
    "I am always prepared.",
    "I leave my belongings around.",
    "I pay attention to details.",
    "I make a mess of things.",
    "I get chores done right away.",
    "I often forget to put things back in their proper place.",
    "I like order.",
    "I shirk my duties.",
    "I follow a schedule.",
    "I am exacting in my work."
  ].map((q, i) => ({
    id: `CSN${i + 1}`,
    trait: "Conscientiousness",
    question: q,
    options: makeOptions()
  })),

  // Openness
  ...[
    "I have a rich vocabulary.",
    "I have difficulty understanding abstract ideas.",
    "I have a vivid imagination.",
    "I am not interested in abstract ideas.",
    "I have excellent ideas.",
    "I do not have a good imagination.",
    "I am quick to understand things.",
    "I use difficult words.",
    "I spend time reflecting on things.",
    "I am full of ideas."
  ].map((q, i) => ({
    id: `OPN${i + 1}`,
    trait: "Openness",
    question: q,
    options: makeOptions()
  }))
];

export default mcqData;
