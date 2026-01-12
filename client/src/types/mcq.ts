export interface Option {
  value: number;
  label: string;
}

export interface MCQ {
  id: string;
  trait: string;
  question: string;
  options: Option[];    // 👈 FIX — options are objects, not strings
}

export interface Answer {
  id: string;
  answer: number;       // numeric answer
}
