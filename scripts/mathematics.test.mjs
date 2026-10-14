import { test } from 'node:test';
import assert from 'node:assert/strict';
const near=(a,b,tol=1e-6)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const harmonic=n=>Array.from({length:n-1},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0);
const choose=(n,k)=>{let r=1;for(let j=1;j<=k;j++)r*= (n-j+1)/j;return r;};
test('counts, HWE expectations, Pearson statistic and diversity spectrum arithmetic',()=>{
 const p=(2*28+32)/(2*80);near(p,.55);near(Math.sqrt(p*(1-p)/160),.0393303);
 const expected=[80*p*p,160*p*(1-p),80*(1-p)**2];near(expected[1],39.6);
 const chisq=[28,32,20].reduce((s,o,i)=>s+(o-expected[i])**2/expected[i],0);near(chisq,2.9466381,1e-5);
 const xi=[3,2,1,0,1];const pi=xi.reduce((s,c,j)=>s+(j+1)*(5-j)*c,0)/15;
 near(pi,3);near(7/harmonic(6),3.06569343);near(4/(harmonic(6)-1),3.11688312);near(xi.reduce((s,c,j)=>s+(j+1)**2*c,0)/15,3);
});
test('finite WF transition probabilities normalize and moments match independent summation',()=>{
 for(const M of [2,6,12])for(let i=0;i<=M;i++){
  const p=i/M;const probs=Array.from({length:M+1},(_,j)=>choose(M,j)*p**j*(1-p)**(M-j));
  near(probs.reduce((a,b)=>a+b,0),1);near(probs.reduce((s,v,j)=>s+j*v,0),i);
  near(probs.reduce((s,v,j)=>s+(j-i)**2*v,0),M*p*(1-p));
 }
 near(choose(6,4)*(2/3)**4*(1/3)**2,240/729);
});
test('Moran moments, finite event variance and heterozygosity decay agree',()=>{
 const M=6,p=4/6;const up=p*(1-p),down=up,stay=1-up-down;
 near(up+down+stay,1);near(up-down,0);near(up+down,4/9);
 const h=2*p*(1-p);const next=up*2*((4+1)/M)*(1-(4+1)/M)+down*2*((4-1)/M)*(1-(4-1)/M)+stay*h;
 near(next,h*(1-2/M**2));
});
test('neutral diffusion absorption BVP and conditional weighting',()=>{
 const N=100,x=.2,q=1-x;
 const absorption=-4*N*(x*Math.log(x)+q*Math.log(q));
 const fix=-4*N*q/x*Math.log(q),loss=-4*N*x/q*Math.log(x);
 near(absorption,x*fix+q*loss);near(absorption,200.16096942);near(fix,357.02968210);
 const step=1e-4,T=y=>-4*N*(y*Math.log(y)+(1-y)*Math.log(1-y));
 const curvature=(T(x+step)-2*T(x)+T(x-step))/step**2;
 near(x*q/(4*N)*curvature,-1,1e-6);
});
test('diversity decay, variable-size products, half-life and bottleneck approximation limits',()=>{
 near(.5*.995**50,.3891562785);near(Math.log(.5)/Math.log(.995),138.282573,1e-5);
 near(.995**3*.95,.93582113125);near(4/(3/100+1/10),30.76923077);
 near(40000/(39999/10000+1),8000.1600032,1e-5);
 near(40000/(39990/10000+10),2857.34695335,1e-5);
});
test('Wahlund and weighted F partition; count exercise; isolation and migration arithmetic',()=>{
 const ps=[.8,.2],w=[.75,.25];const p=ps.reduce((s,v,i)=>s+w[i]*v,0);
 const v=ps.reduce((s,x,i)=>s+w[i]*(x-p)**2,0);const hs=ps.reduce((s,x,i)=>s+w[i]*2*x*(1-x),0),ht=2*p*(1-p);
 near(p,.65);near(v,.0675);near(ht-hs,2*v);near(p*p+v,.49);
 const freqs=[.5,.375,65/120];const pooled=freqs.reduce((a,b)=>a+b)/3;
 const hs3=freqs.reduce((s,x)=>s+2*x*(1-x),0)/3,ht3=2*pooled*(1-pooled);
 near(hs3,.4884259259);near(ht3,.4984567901);near((ht3-hs3)/ht3,.0201238390);
 near(1-(1-.1)*(1-.3),.37);near(1-Math.exp(-.5),.3934693403);near(.9*.8+.1*.2,.74);
 near(1/(1+4*500*.002),.2);
});
test('PCA eigensystem and explained variance verified by multiplication',()=>{
 const C=[[2,1],[1,2]],v=[1/Math.sqrt(2),1/Math.sqrt(2)];
 C.forEach((row,i)=>near(row[0]*v[0]+row[1]*v[1],3*v[i]));
 near(3/(3+1),.75);near(v[0]+v[1],Math.sqrt(2));
});
test('coalescent height, length, variances and frequency-spectrum expectations',()=>{
 const means=[5,4,3,2].map(k=>1/choose(k,2)),variance=means.reduce((s,x)=>s+x*x,0);
 near(means.reduce((a,b)=>a+b),1.6);near(variance,1.14888888889);near(variance*2000**2,4595555.55556,1e-4);
 near(4000*harmonic(5),8333.3333333,1e-4);near(4*harmonic(5),8.333333333);
 near(50/harmonic(10),17.67428812,1e-5);near(50/harmonic(10)*10/9,19.63809791,1e-5);
 for(let n=3;n<20;n++) near(Array.from({length:n-1},(_,j)=>4*(n-j-1)).reduce((a,b)=>a+b)/choose(n,2),4);
});
test('selection recursion, exact Moran probabilities and corrected s conventions',()=>{
 const p=.4,q=.6,wbar=p*p+2*p*q*.9+q*q*.8;near(wbar,.88);near((p*p+p*q*.9)/wbar,.4272727273);
 const fixation=(r,M)=>r===1?1/M:(1-1/r)/(1-r**(-M));
 for(const [r,u] of [[2,.5],[1.1,.09091568827],[1.01,.01570865656],[1,.01],[.99,.005831995253],[.9,.000002951344935]]) near(fixation(r,100),u,1e-10);
 near(-Math.expm1(-.02)/-Math.expm1(-400),.01980132669);
 near(Math.sqrt(1e-6/.01),.01);near(1e-6/(.5*.01),.0002);
 near(.01*.99*.01**2/(1-.01*.01**2),9.90000990001e-7,1e-12);
});
test('SFS weights, Tajima normalization, hazard/CCR, likelihood and AIC examples',()=>{
 near((3*5+2*8+9+8)/15,3.2);near(3.2/23,.1391304348);
 const n=10,S=20,pi=5,a1=harmonic(n),a2=Array.from({length:n-1},(_,j)=>1/(j+1)**2).reduce((a,b)=>a+b);
 const b1=(n+1)/(3*(n-1)),b2=2*(n*n+n+3)/(9*n*(n-1)),e1=(b1-1/a1)/a1,e2=(b2-(n+2)/(n*a1)+a2/a1**2)/(a1*a1+a2);
 near((pi-S/a1)/Math.sqrt(e1*S+e2*S*(S-1)),-1.3762051835);
 near(2*.00001/(.00005+.00005),.2);near(1/(2*.00005),10000);
 near(96*Math.log(.95)+4*Math.log(.05)+3*Math.log(.75)+Math.log(.25),-19.1564259339);
 near((5+3)/(10+30),.2);near(2*6-2*(-116),244);near(Math.exp(-1)/(1+Math.exp(-1)),.2689414214);
});
test('linked-selection contrasts, recombination exposure and QTL LOD MLE example',()=>{
 near((4*5+2*5)/15,2);near((4+2*25)/15,3.6);near(6/harmonic(6),2.6277372263);
 near(Math.exp(-.01*20),.8187307531);
 const y=[0,1,2,4,5,6],mu=3,rss0=y.reduce((s,x)=>s+(x-mu)**2,0);
 const rss1=y.reduce((s,x,i)=>s+(x-(i<3?1:5))**2,0);near(rss0,28);near(rss1,4);
 near(3*Math.log10(rss0/rss1),2.5352941200);near(10**(3*Math.log10(7)),343);
});
test('haplotype margins, bounds, D-prime, r2, decay and rho unit examples',()=>{
 const x=[.36,.24,.14,.26],pA=x[0]+x[1],pB=x[0]+x[2],D=x[0]-pA*pB;
 near(x.reduce((a,b)=>a+b),1);near(pA,.6);near(pB,.5);near(D,.06);
 near(Math.min(pA*(1-pB),(1-pA)*pB),.2);near(D/.2,.3);
 near(D*D/(pA*(1-pA)*pB*(1-pB)),.06);near(D*.9**10,.02092070641);
 near(.06*.9**20,.007294599275);near(Math.log(.5)/Math.log(.9),6.578813479);
 near(4*10000*.001,40);near(.25*(.8-.2)*(.7-.3),.06);near(2*harmonic(5),4.1666666667);
});
test('normalized coding opportunities, MK expected counts/NI/alpha and exact Fisher enumeration',()=>{
 near((9/900)/(6/300),.5);near(1-20*80/(80*40),.5);near(-.75*Math.log(1-4*.1/3),.1073256327);
 const counts=[[20,80],[40,80]],rows=[100,120],cols=[60,160],n=220;
 const chi=counts.reduce((s,row,i)=>s+row.reduce((t,o,j)=>{const e=rows[i]*cols[j]/n;return t+(o-e)**2/e;},0),0);
 near(chi,4.8888888889);
 const mass=a=>choose(60,a)*choose(160,100-a)/choose(220,100);
 const obs=mass(20);let p=0;for(let a=0;a<=60;a++){const pr=mass(a);if(pr<=obs+1e-15)p+=pr;}
 near(p,.03321286563);near(.6**2+.3**2+.1**2,.46);near((Math.log(4)-.2)/.5,2.3725887222);
});
test('frequency-class branch derivation and aggregation extensions',()=>{
 for(let n=3;n<=12;n++) for(let i=1;i<n;i++){
   let sum=0;for(let k=2;k<=n-i+1;k++)sum+=choose(n-i-1,k-2)/((k-1)*choose(n-1,k-1));
   near(sum,1/i);
 }
 near(20/252*(1+13*232/(50*252)),.098362307886);
 near(1-(10+20/3)/(20+20/3),.375);near((1+.46)*.002/2,.00146);
 near(6000/(2*10000),.3);near(2*10000*.0001,2);near(4*10000*1e-8,.0004);
});
