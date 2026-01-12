const options = [
  { value: 1, label: "Dislike" },
  { value: 2, label: "Slightly dislike" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Slightly enjoy" },
  { value: 5, label: "Enjoy" },
];
 const riasecQuestions = [
  // 🔹 Realistic (R1-R8)
  { id: "R1", question: "Lay brick or tile", trait: "R" },
  { id: "R2", question: "Operate a grinding machine in a factory", trait: "R" },
  { id: "R3", question: "Fix a broken faucet", trait: "R" },
  { id: "R4", question: "Assemble electronic parts", trait: "R" },
  { id: "R5", question: "Assemble products in a factory", trait: "R" },
  { id: "R6", question: "Install flooring in houses", trait: "R" },
  { id: "R7", question: "Work on an offshore oil-drilling rig", trait: "R" },
  { id: "R8", question: "Operate construction machinery", trait: "R" }, // based on theme

  // 🔹 Investigative (I1-I8)
  { id: "I1", question: "Develop a new medical treatment or procedure", trait: "I" },
  { id: "I2", question: "Conduct biological research", trait: "I" },
  { id: "I3", question: "Study the structure of the human body", trait: "I" },
  { id: "I4", question: "Study whales and other types of marine life", trait: "I" },
  { id: "I5", question: "Study animal behavior", trait: "I" },
  { id: "I6", question: "Make a map of the bottom of an ocean", trait: "I" },
  { id: "I7", question: "Do research on plants or animals", trait: "I" },
  { id: "I8", question: "Work in a biology lab", trait: "I" },

  // 🔹 Artistic (A1-A8)
  { id: "A1", question: "Write books or plays", trait: "A" },
  { id: "A2", question: "Design artwork for magazines", trait: "A" },
  { id: "A3", question: "Design sets for plays", trait: "A" },
  { id: "A4", question: "Play a musical instrument", trait: "A" },
  { id: "A5", question: "Write a song", trait: "A" },
  { id: "A6", question: "Direct a play", trait: "A" },
  { id: "A7", question: "Perform stunts for a movie or television show", trait: "A" },
  { id: "A8", question: "Conduct a musical choir", trait: "A" },

  // 🔹 Social (S1-S8)
  { id: "S1", question: "Teach an individual an exercise routine", trait: "S" },
  { id: "S2", question: "Help people who have problems with drugs or alcohol", trait: "S" },
  { id: "S3", question: "Give career guidance to people", trait: "S" },
  { id: "S4", question: "Help people with family-related problems", trait: "S" },
  { id: "S5", question: "Do volunteer work at a non-profit organization", trait: "S" },
  { id: "S6", question: "Supervise the activities of children at a camp", trait: "S" },
  { id: "S7", question: "Help elderly people with their daily activities", trait: "S" },
  { id: "S8", question: "Teach children how to read", trait: "S" },

  // 🔹 Enterprising (E1-E8)
  { id: "E1", question: "Sell houses", trait: "E" },
  { id: "E2", question: "Manage a department within a large company", trait: "E" },
  { id: "E3", question: "Operate a beauty salon or barber shop", trait: "E" },
  { id: "E4", question: "Run a toy store", trait: "E" },
  { id: "E5", question: "Sell restaurant franchises to individuals", trait: "E" },
  { id: "E6", question: "Manage the operations of a hotel", trait: "E" },
  { id: "E7", question: "Sell merchandise at a department store", trait: "E" },
  { id: "E8", question: "Manage a clothing store", trait: "E" },

  // 🔹 Conventional (C1-C8)
  { id: "C1", question: "Test the quality of parts before shipment", trait: "C" },
  { id: "C2", question: "Handle customers' bank transactions", trait: "C" },
  { id: "C3", question: "Keep shipping and receiving records", trait: "C" },
  { id: "C4", question: "Operate a calculator", trait: "C" },
  { id: "C5", question: "Compute and record statistical and other numerical data", trait: "C" },
  { id: "C6", question: "Generate the monthly payroll checks for an office", trait: "C" },
  { id: "C7", question: "Use a computer program to generate customer bills", trait: "C" },
  { id: "C8", question: "Inventory supplies using a hand-held computer", trait: "C" }
].map((q) => ({ ...q, options }));

export default riasecQuestions;