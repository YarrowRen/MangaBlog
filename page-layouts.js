import {bounds,rectangle,seeded,split} from './geometry.js';
const H=(a,b,r=.5)=>({axis:'y',a,b,r});
const V=(a,b,r=.5)=>({axis:'x',a,b,r});
const three=()=>H(1,H(1,1),1/3);
// All templates are slicing trees. Neighbours always share a single cut.
export const pageLayouts=[
 {name:'开场大格',tree:V(H(1,1,.6),H(1,three(),.3),.57)},
 {name:'三段叙事',tree:H(V(1,1,.64),H(V(1,1,.42),V(1,1,.58)),1/3)},
 {name:'左右对页',tree:V(three(),three(),.5)},
 {name:'长镜与特写',tree:H(1,H(V(1,H(1,1),.55),V(1,1,.62),.6),.3)},
 {name:'交错分镜',tree:H(V(H(1,1),1,.43),V(1,H(1,1),.58),.5)},
 {name:'收束横格',tree:H(V(H(1,1),H(1,1),.58),H(1,1,.52),.65)},
];
function leaves(tree){return tree===1?1:leaves(tree.a)+leaves(tree.b);}
function prune(tree,count){
 if(count<=0)return null;if(tree===1)return 1;
 const left=leaves(tree.a),a=prune(tree.a,Math.min(left,count)),b=prune(tree.b,count-left);
 if(!a)return b;if(!b)return a;return {...tree,a,b};
}
function stack(count){return count===1?1:H(1,stack(count-1),1/count);}
export function pagePartition(w,h,count,index,seed='page') {
 if(!count)return [];
 const template=pageLayouts[((index%pageLayouts.length)+pageLayouts.length)%pageLayouts.length];
 const tree=w<620?stack(count):prune(template.tree,count);
 const random=seeded(`${seed}-${index}`);
 function walk(poly,node){
  if(node===1)return [poly];
  const b=bounds(poly),ratio=w<620?node.r:Math.max(.26,Math.min(.74,node.r+(random()-.5)*.035));
  const amplitude=(random()-.5)*.10;
  // Cap drift relative to the *local* box, even if content makes the page tall.
  let pair;
  if(node.axis==='x'){
   const slope=amplitude*b.w/Math.max(1,b.h);
   pair=split(poly,-1,slope,b.x+b.w*ratio-slope*(b.y+b.h*.5));
  }else{
   const slope=amplitude*b.h/Math.max(1,b.w);
   pair=split(poly,slope,-1,b.y+b.h*ratio-slope*(b.x+b.w*.5));
  }
  return [...walk(pair[0],node.a),...walk(pair[1],node.b)];
 }
 return walk(rectangle(w,h),tree);
}
