import test from 'node:test';
import assert from 'node:assert/strict';
import { KERN, sdof, crushing, failure, column, maximum, yokel, profile, dimensional, wytheRatio } from '../src/physics.js';
const close = (a,b,tol=1e-8) => assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);
test('SDOF branches join continuously and attain the analytical peak',()=>{
  for(const e of [.005,.05,.1,.15]) {
    close(sdof(KERN-1e-9,e),sdof(KERN+1e-9,e),1e-7);
    const pk=maximum(d=>sdof(d,e),e);
    close(pk.d,(1+4*e)/6);close(pk.p,(1-2*e)**3);
  }
  close(sdof(.5,.2),0);close(sdof(0,0),1);
});
test('Finite-strength regimes use the first intersection on the rising branch',()=>{
  for(const [beta,mode] of [[.3,'Uncracked crushing'],[1,'Cracked crushing'],[2,'Buckling']]) {
    const f=failure(.1,beta);assert.equal(f.mode,mode);
    if(mode!=='Buckling')close(f.p,crushing(f.d,beta));
    assert.ok(f.d<=(1+.4)/6);
  }
  for(const e of [.05,.1,.2,.4]) {
    const boundary=2*(1-2*e)**2;
    close(failure(e,boundary-1e-7).p,failure(e,boundary+1e-7).p,1e-6);
  }
  close(failure(0,.5).p,.5);
  close(failure(0,1.5).p,1);assert.equal(failure(0,1.5).mode,'Buckling');
});
test('Sahlin solution agrees with universal Yokel curve for entirely cracked columns',()=>{
  for(const e of [KERN,.2,.3,.4])for(const k of [.1,.3,.61165,.8,.99]) {
    const d=.5-k*(.5-e);
    close(column(d,e),yokel(k)*27*(.5-e)**3);
  }
  const pk=maximum(yokel,0,1);
  close(pk.d,.61165,1e-5);close(pk.p,.2837,5e-5);
});
test('Column branches join at the kern and recover the elastic secant solution',()=>{
  for(const e of [0,.03,.1,.16]) {
    close(column(KERN-1e-9,e),column(KERN+1e-9,e),1e-7);
    close(column(.12,.03),(2*Math.acos(.25)/Math.PI)**2);
  }
  close(column(.5,.1),0);
});
test('Exact column profile satisfies symmetry and end eccentricities',()=>{
  for(const [d,e] of [[.1,.03],[.25,.03],[.4,.1],[.3,.2],[.46,.4]]) {
    close(profile(d,e,0),d);close(profile(d,e,1),e);
    let last=d;
    for(let i=1;i<=20;i++){const v=profile(d,e,i/20);assert.ok(v<=last+1e-9);last=v;}
  }
});
test('Dimensional loads scale with depth and cubed thickness; independent wythes retain 1/n²',()=>{
  const s={E:2000,t:300,b:1000,H:4000,a:100}, p=dimensional(s);
  close(dimensional({...s,b:2000}).columnEuler,2*p.columnEuler);
  close(dimensional({...s,t:600}).sdofEuler,8*p.sdofEuler);
  close(wytheRatio(2),.25);close(wytheRatio(3),1/9);
  const wythe=dimensional({...s,t:s.t/3}).columnEuler;
  close(3*wythe/p.columnEuler,wytheRatio(3));
});
