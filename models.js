import * as THREE from "three";
import {RoundedBoxGeometry} from "./vendor/RoundedBoxGeometry.js";

export function modelTools(scene){
  const materials=new Map(), geometry=new THREE.BoxGeometry(1,1,1);
  const mat=color=>{
    if(typeof color!=="string")return color;
    if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.82,metalness:.04}));
    return materials.get(color);
  };
  const add=(parent,geo,color,x,y,z,cast=true)=>{
    const mesh=new THREE.Mesh(geo,mat(color));
    mesh.position.set(x,y,z);
    mesh.castShadow=cast;
    mesh.receiveShadow=true;
    parent.add(mesh);
    return mesh;
  };
  const box=(p,x,y,z,w,h,d,c)=>{const item=add(p,geometry,c,x,y,z);item.scale.set(w,h,d);return item;};
  const round=(p,x,y,z,w,h,d,r,c)=>add(p,new RoundedBoxGeometry(w,h,d,2,r),c,x,y,z);
  const cyl=(p,x,y,z,r,h,c,rTop=r)=>add(p,new THREE.CylinderGeometry(rTop,r,h,14),c,x,y,z);
  const group=(parent,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
  function graphic(p,x,y,z,w,h,paint,floor=false){
    const canvas=document.createElement("canvas");
    canvas.width=512;canvas.height=Math.max(80,Math.min(512,Math.round(512*h/w)));
    const ctx=canvas.getContext("2d");paint(ctx,canvas.width,canvas.height);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
    const material=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,alphaTest:.025,toneMapped:false});
    const item=add(p,new THREE.PlaneGeometry(w,h),material,x,y,z,false);
    if(floor)item.rotation.x=-Math.PI/2;
    return item;
  }
  function label(p,x,y,z,w,h,text,fg="#fff8e9",bg="#2b4150",floor=false){
    return graphic(p,x,y,z,w,h,(ctx,width,height)=>{
      if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);}
      ctx.fillStyle=fg;ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.font="800 "+Math.floor(height*.69)+"px Inter, sans-serif";
      ctx.fillText(text,width*.5,height*.53,width*.93);
    },floor);
  }
  function flat(x,z,w,d,y,color){
    const b=add(scene,new THREE.PlaneGeometry(w,d),color,x,y,z,false);
    b.rotation.x=-Math.PI/2;
    return b;
  }
  return {box,round,cyl,group,graphic,label,flat,mat};
}

export const colors={navy:"#263b49",steel:"#526a73",dark:"#202c33",gray:"#82969b",ice:"#c9d9d7",white:"#eff3e8",cream:"#f2e1c0",
  yellow:"#efb64f",orange:"#c9794c",mint:"#5eb196",red:"#b45645",green:"#588b71",wood:"#a27c59",cardboard:["#b58a5e","#c59e72","#daa778","#8b9d9e"]};

export function buildProps(tools, scene){
  const {box,round,cyl,group,graphic,label,mat}=tools;
  const C=colors;
  function post(x,y,z,height=.95,r=.091){
    const stem=cyl(scene,x,y+height/2,z,r,height,C.yellow);
    cyl(scene,x,y+height-.30,z,r+.007,.13,C.dark);
    cyl(scene,x,y+height-.035,z,r*.96,.064,C.cream);
    box(scene,x,y+.02,z,.31,.04,.31,C.steel);
    return stem;
  }
  function rail(x1,z1,x2,z2,y,h=.86){
    const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);
    const g=group(scene,(x1+x2)/2,y,(z1+z2)/2);
    g.rotation.y=-Math.atan2(dz,dx);
    for(const level of [h*.54,h])box(g,0,level,0,len,.057,.046,C.yellow);
    const count=Math.ceil(len/2);
    for(let i=0;i<=count;i++)box(g,-len/2+len*i/count,h/2,0,.055,h,.070,C.steel);
  }
  function pallet(x,y,z,variant=0,loaded=true,root=scene,scale=1){
    const object=group(root,x,y,z);
    object.scale.setScalar(scale);
    for(const xx of [-.46,0,.46])box(object,xx,.064,0,.13,.125,1.04,C.wood);
    for(const zz of [-.432,-.215,0,.215,.432])box(object,0,.15,zz,1.24,.061,.177,"#c9a77d");
    if(loaded){
      const size = variant%2===0 ? .89 : .52;
      const material = C.cardboard[variant%C.cardboard.length];
      box(object,0,.183+size/2,0,1.08,size,.91,material);
      box(object,0,.185+size,.002,.082,.008,.91,C.cream);
      box(object,0,.18+size/2,.457,.079,size,.008,"#e0c498");
      const decal=label(object,.26,.32+size*.38,.464,.26,.13,"▏▌▍▏▎▍","#263839","#f6f0dd");
      decal.userData.canvasSortAnchor=new THREE.Vector3(0,.183+size/2,.468);
    }
    return object;
  }
  function wheel(parent,x,y,z,r,w=.16){
    const tire=cyl(parent,x,y,z,r,w,C.dark); tire.rotation.z=Math.PI/2;
    const hub=cyl(parent,x,y,z,r*.46,w+.012,C.gray); hub.rotation.z=Math.PI/2;
  }
  function forklift(x,y,z,heading=0){
    const g=group(scene,x,y,z);g.rotation.y=heading;
    round(g,0,.37,-.22,1.28,.47,1.72,.12,C.yellow);
    round(g,0,.62,-.56,1.20,.45,.83,.14,"#e59b37");
    box(g,0,.45,.33,1.14,.12,.61,C.dark);
    for(const wx of [-.60,.60]){
      wheel(g,wx,.251,.39,.255);wheel(g,wx,.215,-.72,.215);
      for(const zz of [-.72,.28])box(g,wx,.99,zz,.064,1.07,.07,C.navy);
      box(g,wx*.68,.93,.64,.074,1.72,.11,C.steel);
      box(g,wx*.68,.15,1.18,.112,.055,.96,C.steel);
      box(g,wx,.55,-1.04,.13,.09,.05,C.red);
    }
    round(g,0,1.55,-.20,1.24,.092,1.2,.028,C.navy);
    cyl(g,-.42,1.65,-.51,.090,.13,C.orange);
    box(g,0,.85,-.40,.33,.18,.32,C.dark);
    box(g,0,.99,-.55,.31,.28,.08,C.dark);
    const steer=cyl(g,.03,.96,.20,.16,.035,C.dark);steer.rotation.x=.45;
    box(g,0,1.17,.615,.86,.062,.105,C.steel);
    return g;
  }
  function trolley(x,y,z,powered){
    const g=group(scene,x,y,z);
    const color=powered?"#619485":C.orange;
    round(g,0,.21,-.22,.53,.32,.61,.05,color);
    for(const xx of [-.18,.18])box(g,xx,.076,.55,.13,.067,1.23,color);
    const handle=box(g,0,.56,-.48,.062,.81,.066,C.steel);handle.rotation.x=-.23;
    box(g,0,.929,-.559,.31,.056,.08,C.dark);
    for(const xx of [-.20,.20])wheel(g,xx,.09,-.3,.093,.075);
    return g;
  }
  function truck(x,z,{open=false,color="#617d85",heading=0}={}){
    const root=group(scene,x,0,z);root.rotation.y=heading;
    const length=10.53,y=.98,back=-length/2,front=length/2;
    box(root,0,.70,.15,2.32,.20,length,C.dark);
    box(root,0,1.052,0,2.54,.31,length,C.gray);
    box(root,0,1.216,0,2.46,.06,length-.11,"#b49d80");
    for(const xx of [-1.267,1.267]){
      box(root,xx,2.31,0,.10,2.35,length,C.ice);
      box(root,xx,1.356,0,.111,.09,length,color);
      for(let i=0;i<12;i++)box(root,xx*1.043,2.405,back+.4+i*.87,.018,1.67,.026,"#a3b5b3");
    }
    box(root,0,2.31,front,2.57,2.35,.13,C.ice);
    if(!open){
      box(root,0,3.52,0,2.62,.10,length+.14,C.ice);
      box(root,0,2.30,back,2.47,2.39,.11,C.ice);
      for(const xx of [-.77,.77])box(root,xx,2.28,back-.062,.041,2.09,.055,C.steel);
    }else{
      for(const xx of [-1.16,1.16])box(root,xx,2.33,back-.09,.13,2.43,.16,C.steel);
      box(root,0,3.50,back-.03,2.55,.105,.19,C.steel);
      for(let i=0;i<8;i++)box(root,0,1.251,back+.55+i*1.23,2.34,.006,.029,C.cream);
      pallet(-.53,1.26,1.90,2,true,root,.87);pallet(.57,1.26,2.93,0,true,root,.87);
      pallet(.49,1.26,-1.17,2,true,root,.84);
    }
    for(const tireZ of [-3.17,-2.12,front+.40,front+2.54])for(const xx of [-1.12,1.12])wheel(root,xx,.54,tireZ,.49,.30);
    round(root,0,1.60,front+1.71,2.53,2.22,2.35,.18,color);
    box(root,0,2.089,front+2.902,2.03,.55,.044,"#30484f");
    for(const xx of [-1.29,1.29]){
      box(root,xx,2.055,front+1.95,.036,.48,.79,"#3d5760");
      box(root,xx,1.043,front+2.91,.34,.19,.094,C.cream);
    }
    box(root,0,.87,front+2.84,2.54,.23,.19,C.dark);
    return root;
  }
  function person(x,y,z,color=C.yellow){
    const g=group(scene,x,y,z);
    for(const xx of [-.15,.15]){
      round(g,xx,.41,0,.19,.70,.22,.035,C.navy);
      round(g,xx,.092,.10,.211,.15,.34,.036,C.dark);
      round(g,xx*2,.98,.018,.116,.54,.126,.035,color);
    }
    round(g,0,1.06,0,.49,.58,.29,.09,color);
    box(g,0,.94,.152,.42,.04,.009,C.white);
    cyl(g,0,1.435,0,.117,.24,"#b48b74");
    cyl(g,0,1.58,0,.158,.049,C.white);
    cyl(g,0,1.638,0,.143,.092,C.white,.106);
    return g;
  }
  function table(x,y,z,w=2.65,d=1.2){
    const t=group(scene,x,y,z);
    for(const xx of [-w*.42,w*.42])for(const zz of [-d*.39,d*.39])box(t,xx,.48,zz,.075,.94,.075,C.steel);
    round(t,0,.99,0,w,.13,d,.032,C.cream);
    box(t,0,.34,-.35,w*.86,.09,.075,C.steel);
    return t;
  }
  function computer(p,x,z){
    box(p,x,1.11,z,.28,.09,.22,C.navy);
    box(p,x,1.24,z,.061,.27,.061,C.steel);
    round(p,x,1.43,z,.54,.32,.054,.019,C.navy);
    label(p,x,1.43,z+.032,.46,.25,"▒  ▤","#9de3c6","#294a54");
    box(p,x,1.07,z+.28,.39,.031,.15,C.steel);
    box(p,x+.29,1.08,z+.28,.065,.041,.09,C.dark);
  }
  function printer(p,x,z,type){
    const small=type==="ZEBRA";
    const width=small?.33:.48,d=small?.37:.39;
    round(p,x,1.16,z,width,.21,d,.03,small?C.navy:C.white);
    box(p,x,1.146,z+d/2+.003,width*.78,.024,.014,C.dark);
    label(p,x,1.204,z+d/2+.006,width*.77,.060,type,small?C.white:C.navy,small?C.navy:C.white);
    const slip=box(p,x,1.135,z+d/2+.074,width*.54,.012,.15,C.white);slip.rotation.x=.18;
  }
  function lamp(p,x,z){
    cyl(p,x,1.075,z,.127,.06,C.steel);
    box(p,x,1.36,z,.046,.57,.043,C.steel);
    const swing=box(p,x+.123,1.65,z+.061,.30,.040,.041,C.steel);swing.rotation.y=.40;
    round(p,x+.244,1.60,z+.111,.179,.085,.137,.018,C.yellow);
  }
  return {post,rail,pallet,forklift,trolley,truck,person,table,computer,printer,lamp};
}
