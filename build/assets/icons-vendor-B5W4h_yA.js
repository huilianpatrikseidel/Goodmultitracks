import{r as s}from"./react-vendor-BoGJM_Cg.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),w=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,o,r)=>r?r.toUpperCase():o.toLowerCase()),d=e=>{const t=w(e);return t.charAt(0).toUpperCase()+t.slice(1)},l=(...e)=>e.filter((t,o,r)=>!!t&&t.trim()!==""&&r.indexOf(t)===o).join(" ").trim();/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var k={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=s.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:r,className:c="",children:n,iconNode:i,...p},h)=>s.createElement("svg",{ref:h,...k,width:t,height:t,stroke:e,strokeWidth:r?Number(o)*24/Number(t):o,className:l("lucide",c),...p},[...i.map(([m,u])=>s.createElement(m,u)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a=(e,t)=>{const o=s.forwardRef(({className:r,...c},n)=>s.createElement(f,{ref:n,iconNode:t,className:l(`lucide-${C(d(e))}`,`lucide-${e}`,r),...c}));return o.displayName=d(e),o};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],$=a("check",g);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],x=a("chevron-down",v);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],A=a("chevron-up",_);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],L=a("x",b);export{x as C,L as X,$ as a,A as b};
