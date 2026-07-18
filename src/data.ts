import raw from './courseData.json';
export type AssessmentQuestion={id:string;type:'mcq'|'tf';question:string;options?:string[];answer:number|boolean;explanation:string};
export type Lesson={moduleId:string;moduleIcon:string;moduleTitle:string;moduleDescription:string;id:string;title:string;lecture:string;minutes:number;summary:string;objectives:string[];sections:[string,string][];equation:string;variables:string[];workedExample:string;commonMistakes:string[];keyStatement:string;distractors:string[];trueFacts:string[];falseFacts:string[];aiPrompt:string;sourceBasis?:string;concepts:string[];assessment:AssessmentQuestion[]};
export type Module={id:string;icon:string;title:string;description:string;lessons:{id:string;title:string;lecture:string;minutes:number;summary:string}[]};
export type Concept={term:string;definition:string;lessons:string[];mastery:number};
export type Workspace={id:string;title:string;icon:string;description:string;stages:string[]};
export const modules=raw.modules as Module[]; export const lessons=raw.lessons as Lesson[]; export const concepts=raw.concepts as Concept[]; export const workspaces=raw.workspaces as Workspace[];
