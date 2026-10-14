import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessmentBankMarker, assessmentInitialState, scoreAssessment } from '../src/assessmentState.ts';
import { buildTutorContext } from '../src/courseContext.ts';

const questions=[{id:'new-a',type:'mcq',options:['x','y'],answer:1},{id:'new-b',type:'tf',answer:false}];
test('old IDs never prefill or display old score on revised questions',()=>{
 const prior={answers:{mc1:0,tf1:true},score:2,max:2};
 assert.deepEqual(assessmentInitialState(questions,prior),{answers:{},result:undefined,compatible:false});
 assert.deepEqual(prior,{answers:{mc1:0,tf1:true},score:2,max:2});
});
test('compatible answers and original score can be restored; invalid answers cannot',()=>{
 const prior={answers:{'new-a':1,'new-b':false},score:2,max:2};
 assert.equal(assessmentInitialState(questions,prior).result,2);
 assert.equal(assessmentInitialState(questions,{...prior,max:10}).compatible,false);
 assert.equal(assessmentInitialState(questions,{...prior,answers:{'new-a':9}}).compatible,false);
 assert.equal(assessmentInitialState(questions,{...prior,answers:{'new-b':0}}).compatible,false);
});
test('one point per correct response, booleans distinct from option indices, no credit for omissions',()=>{
 assert.equal(scoreAssessment(questions,{'new-a':1,'new-b':false}),2);
 assert.equal(scoreAssessment(questions,{'new-a':true,'new-b':0}),0);
 assert.equal(scoreAssessment(questions,{}),0);
 assert.equal(scoreAssessment(questions,{'new-a':1,old:1}),1);
});
test('question-set marker restores a blank current attempt without reinterpreting an unversioned blank legacy attempt',()=>{
 const marker=assessmentBankMarker(questions);
 const previous={answers:{[marker]:true},score:0,max:2};
 assert.deepEqual(assessmentInitialState(questions,previous),{answers:{},result:0,compatible:true});
 assert.equal(scoreAssessment(questions,previous.answers),0);
 assert.equal(assessmentInitialState(questions,{answers:{},score:0,max:2}).compatible,false);
 assert.equal(assessmentInitialState([...questions].reverse(),previous).compatible,false);
 assert.equal(assessmentInitialState(questions,{...previous,answers:{[marker]:false}}).compatible,false);
});
test('all authored answer keys produce full scores; archive preserves prior question meanings',()=>{
 const course=JSON.parse(fs.readFileSync('src/courseData.json','utf8'));
 const archive=JSON.parse(fs.readFileSync('src/assessmentArchive.json','utf8'));
 for(const l of course.lessons){
  assert.equal(scoreAssessment(l.assessment,Object.fromEntries(l.assessment.map(q=>[q.id,q.answer]))),l.assessment.length);
  assert.equal(archive[l.id].length,10);
  if(l.equationFormat==='latex') assert(l.assessment.every(q=>!archive[l.id].some(old=>old.id===q.id)));
 }
});
test('tutor receives bounded authored context with stable lesson IDs and citations',()=>{
 const course=JSON.parse(fs.readFileSync('src/courseData.json','utf8'));
 const context=buildTutorContext('Moran birth death transition scaling',course.lessons,[]);
 assert(context.includes('l3-moran'));assert(context.includes('Hahn'));assert(context.length<=28000);
 assert(!context.includes('private-course-materials/Molecular population genetics by Hahn'));
});
