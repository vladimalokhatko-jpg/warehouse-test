import * as THREE from "three";
import {floor,shell,zones,routeColors,receiving,charging,dispatch,slab} from "./layout.js?v=21";
import {modelTools,buildProps,colors as C} from "./models.js?v=21";
import {SoftwareRenderer} from "./renderer-fallback.js?v=21";

export function makeWarehouse(canvas){
  const scene=new THREE.Scene();
  const tools=modelTools(scene);
  const {box,round,cyl,group,label,graphic,flat}=tools;
  const {post,rail,pallet,forklift,reachTruck,trolley,person,table,computer,printer,lamp}=buildProps(tools,scene);
  const {left,right,front,back}=shell;
  // English names are generic warehouse functions, not proprietary status codes.
  const labels={
    5:"BATTERY CHARGING",11:"RECEIVING",12:"INSPECTION",
    13:"PUTAWAY STAGING",14:"QUARANTINE",
    15:"PALLET RACKING",16:"LONG MATERIALS",17:"MEZZANINE",
    18:"KITTING & PACKING",19:"PACKING SUPPLIES",
    20:"EQUIPMENT PARKING",21:"DISPATCH STAGING",
    22:"DAMAGED PARTS",23:"CHEMICAL STORAGE"
  };
  const ink="#334a52", concrete="#c5ceca", normalFloor="#bcc6c4", white="#f7f0dd";
  const lane="#d7ae62", path="#55ae79", deck="#aab9b8", wall="#a9bdbe";
  const y=floor+.01;
  const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity!==1,opacity,depthWrite:opacity===1,toneMapped:false});
  function boundsBox(bounds){
    const [a,b,c,d]=bounds;
    return [(a+b)/2,(c+d)/2,b-a,d-c];
  }
  function outline(x,z,w,d,height,material,size=.06){
    for(const a of [-1,1]){
      flat(x,z+a*d/2,w+size,size,height,material);
      flat(x+a*w/2,z,size,d-size,height,material);
    }
  }
  function groundText(x,z,w,d,text,color=ink,height=y+.038,heading=0){
    const mesh=label(scene,x,height,z,w,d,text,color,null,true);
    if(heading)mesh.rotateZ(heading);
    return mesh;
  }
  function sign(x,height,z,w,h,text,color=white,bg=C.navy,heading=0){
    const holder=group(scene,x,height,z);holder.rotation.y=heading;
    box(holder,0,0,-.012,w+.075,h+.042,.066,bg);
    const face=label(holder,0,0,.029,w,h,text,color,bg);
    face.userData.canvasSortAnchor=new THREE.Vector3(0,0,.039);
    return holder;
  }
  function markArrow(x,z,heading=0,length=.95,color=white,height=y+.034){
    const mesh=graphic(scene,x,height,z,length*.44,length,(ctx,w,h)=>{
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(w*.5,h*.04);ctx.lineTo(w*.98,h*.43);
      ctx.lineTo(w*.64,h*.43);ctx.lineTo(w*.64,h*.96);ctx.lineTo(w*.36,h*.96);ctx.lineTo(w*.36,h*.43);
      ctx.lineTo(w*.02,h*.43);ctx.closePath();ctx.fill();
    },true);
    mesh.rotateZ(heading);
  }
  // Flat painted industrial floor pictograms: canvas decals, not floating 3D signs.
  // The symbols deliberately have transparent backgrounds to preserve the lane color.
  function floorSymbol(kind,x,z,scale=1,turn=0){
    const color=kind==="pedestrian"?"#f4f7ee":"#394b48";
    const item=graphic(scene,x,y+.065,z,scale,scale*1.12,(ctx,W,H)=>{
      const k=Math.min(W,H)/100;
      ctx.save();
      ctx.translate(W/2,H/2);ctx.scale(k,k);ctx.translate(-50,-50);
      ctx.fillStyle=color;ctx.strokeStyle=color;
      if(kind==="pedestrian"){
        // Standard readable walking-person glyph rather than directional arrows.
        ctx.beginPath();ctx.arc(51,14,8.5,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(46,25);ctx.lineTo(56,26);ctx.lineTo(61,48);
        ctx.lineTo(53,55);ctx.lineTo(44,45);ctx.closePath();ctx.fill();
        ctx.lineWidth=7;ctx.lineCap="round";ctx.lineJoin="round";
        ctx.beginPath();ctx.moveTo(47,30);ctx.lineTo(33,46);ctx.lineTo(23,49);ctx.stroke();
        ctx.beginPath();ctx.moveTo(56,33);ctx.lineTo(69,42);ctx.lineTo(77,40);ctx.stroke();
        ctx.beginPath();ctx.moveTo(50,50);ctx.lineTo(38,68);ctx.lineTo(27,82);ctx.stroke();
        ctx.beginPath();ctx.moveTo(54,49);ctx.lineTo(66,62);ctx.lineTo(72,83);ctx.stroke();
      }else{
        // Counterweight truck silhouette: mast, forks, overhead guard and two wheels.
        ctx.fillRect(20,36,45,29);
        ctx.fillRect(24,29,27,9);
        ctx.fillRect(56,28,7,38);
        ctx.fillRect(69,31,5,42);
        ctx.fillRect(75,31,17,5);
        ctx.fillRect(75,68,17,5);
        ctx.clearRect(38,39,13,14);  // seat/driver area
        ctx.beginPath();ctx.arc(29,69,10,0,2*Math.PI);ctx.fill();
        ctx.beginPath();ctx.arc(60,69,10,0,2*Math.PI);ctx.fill();
        ctx.fillRect(24,18,4,13);ctx.fillRect(57,18,4,13);
        ctx.fillRect(25,17,35,5);
      }
      ctx.restore();
    },true);
    if(turn)item.rotateZ(turn);
    return item;
  }
  function brokenLine(x,z,w,d,elevation,color){
    const vertical=d>w;
    const pieces=Math.max(1,Math.ceil(Math.max(w,d)/1.25));
    for(let i=0;i<pieces;i++){
      const along=(i+.5)/pieces-.5;
      flat(x+(vertical?0:w*along),z+(vertical?d*along:0),vertical?w:w/pieces*.58,vertical?d/pieces*.58:d,elevation,color);
    }
  }
  function bays(x,z,columns,spacing,depth=1.8,prefix="",markColor="#819793"){
    for(let i=0;i<columns;i++){
      const cx=x+(i-(columns-1)/2)*spacing;
      outline(cx,z,spacing*.83,depth,y+.033,markColor,.045);
      if(prefix)groundText(cx,z+depth*.41,spacing*.68,.29,prefix+String(i+1).padStart(2,"0"));
    }
  }
  function wallStrip(x,z,w,d,height=.77){
    box(scene,x,floor+height/2,z,w,height,d,wall);
    box(scene,x,floor+height,z,w+.02,.081,d+.10,C.steel);
  }
  function fence(x0,z0,x1,z1,color=C.red){
    const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz);
    const wall=group(scene,(x0+x1)/2,floor,(z0+z1)/2);
    wall.rotation.y=-Math.atan2(dz,dx);
    for(const hh of [.13,1.09])box(wall,0,hh,0,l,.048,.045,color);
    const count=Math.ceil(l/.29);
    for(let i=0;i<=count;i++)box(wall,l*(i/count-.5),.603,0,.019,.98,.020,color);
    for(const pos of [-1,1])box(wall,pos*l/2,.57,0,.066,1.14,.071,color);
  }
  function doorway(x,z,heading,title,{color="#6d948a",w=1.28}={}){
    const frame=group(scene,x,floor,z);frame.rotation.y=heading;
    round(frame,0,1.08,0,w+.22,2.24,.21,.032,C.steel);
    round(frame,0,1.061,.112,w,2.06,.07,.024,color);
    box(frame,0,1.48,.162,w*.51,.405,.029,"#a6c8cb");
    round(frame,w*.336,.98,.185,.163,.045,.046,.01,C.cream);
    if(title)label(frame,0,2.30,.164,w+.46,.29,title,white,"#345f57");
  }
  // Slab, cutaway walls and van apron.
  const base=round(scene,slab.x,-.39,slab.z,slab.width,.64,slab.depth,.21,"#759296");
  base.userData.canvasLayer=0;
  const inside=box(scene,(left+right)/2,.577,(back+front)/2,right-left,1.19,front-back,deck);
  inside.userData.canvasLayer=0;
  flat((left+right)/2,(back+front)/2,right-left,front-back,floor,concrete);
  box(scene,-29.13,.577,12.93,2.66,1.19,6.12,deck).userData.canvasLayer=0;
  for(let i=0;i<6;i++)box(scene,-29.13,(.98-.164*i)*.5,16.15+i*.24,2.70,.98-.164*i,.26,deck);
  for(const x of [-30.39,-27.87]){
    rail(x,10.38,x,15.92,floor,.98);
    box(scene,x,floor+.085,13.15,.055,.17,5.54,C.steel);
    for(const t of [0,.5,1]){
      const z=15.92+1.63*t;
      const base=floor*(1-t);
      box(scene,x,base+.49,z,.063,.98,.063,C.steel);
    }
    for(const height of [.52,.98]){
      const a=new THREE.Vector3(x,floor+height,15.92);
      const b=new THREE.Vector3(x,height,17.55);
      const direction=b.clone().sub(a);
      const center=a.clone().add(b).multiplyScalar(.5);
      const handrail=cyl(scene,center.x,center.y,center.z,.034,direction.length(),C.yellow);
      handrail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    }
  }
  flat(-1.6,14.15,58.65,8.20,.013,"#626f79");
  flat(34.1,5.32,11.8,9.42,floor,"#c4d1cd");
  flat(30.20,-29.06,4.34,7.27,.015,"#65737c");
  box(scene,29.96,.56,-29.14,3.94,1.11,4.28,deck).userData.canvasLayer=0;
  flat(29.96,-29.14,3.94,4.29,floor,"#aebbb8");
  for(const x of [-26,-18,-9,0,9,18,26])flat(x,-17.4,.019,54.5,y,"#a0b1ae");
  for(const z of [-42,-34,-26,-18,-10,-2,6])flat(-.9,z,57.67,.020,y,"#a8b8b4");
  for(let z=-42;z<10;z+=6.5)wallStrip(-30.94,z,.20,6.44,.66);
  wallStrip(-30.94,8.36,.20,3.26,.66);
  for(let x=-27.3;x<28;x+=7.3)wallStrip(x,-44.90,7.20,.20,.91);
  for(const [z0,z1] of [[-45,-31.12],[-27.08,-26.41],[-24.95,1.57],[2.97,5.23],[9.30,10]]){
    wallStrip(27.88,(z0+z1)/2,.19,z1-z0,.69);
  }
  const [dockOne,dockTwo]=receiving.docks;
  for(const [x0,x1] of [[left,-29.86],[-28.30,dockOne-2.51],[dockOne+2.51,dockTwo-2.51],[dockTwo+2.51,right]]){
    wallStrip((x0+x1)/2,9.96,x1-x0,.24,.62);
  }
  for(let x=-29;x<29;x+=9.5){
    box(scene,x,floor+1.89,-44.3,.19,3.78,.22,C.steel);
    box(scene,x,floor+3.76,-43.82,1.55,.075,.64,C.steel);
    box(scene,x,floor+3.70,-43.83,1.30,.041,.40,C.cream);
  }

  // Distinct continuous walking and powered-truck routes (B preview).
  // One uninterrupted left corridor connects the office, receiving and rear exit.
  const pathSpans=[
    [-29.13,-16.80,2.45,53.60],       // continuous perimeter walkway (-43.60 to +10)
    [-24.85,4.35,6.73,1.35],          // receiving-office approach
    [-26.64,-6.43,2.55,1.30],         // safe access stops at staging edge, not over pallet bays
    [-27.56,-2.10,1.24,1.22],         // pedestrian entry to morning huddle
    [-26.53,-28.15,3.20,1.14],        // forklift-parking access
    [-4.60,-35.36,49.10,1.24],        // rear walkway to chemical personnel door
    [-29.13,13.20,2.44,6.0],          // exterior entrance to walkway
  ];
  const liftSpans=[
    // The former D01-D06 blue unloading buffer is now one clear drive-only aisle.
    [2.15,3.38,47.70,4.32],[dockOne,6.50,3.75,5.84],[dockTwo,6.50,3.75,5.84],
    [24.14,-12.50,4.50,38.50],[-.94,-4.45,49.6,1.90],[-.89,-10.41,49.5,1.62],
    [-.92,-16.84,49.5,2.30],[-.89,-25.55,49.5,2.29],[-.92,-33.04,49.5,3.03],
    [8.75,-36.2,5.23,3.46],boundsBox(dispatch.dockApproach),
    [25.90,7.22,4.60,2.88],boundsBox(charging.aisle),
  ];
  // Paint the union of rectangles only once: no dark double-opacity patches
  // at the crosses or hairline seams in the green aisle.
  function unionFloor(spans,material,elevation){
    const rects=spans.map(([x,z,w,d])=>({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2}));
    const cuts=[...new Set(rects.flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const x0=cuts[i],x1=cuts[i+1],mx=(x0+x1)/2;
      if(x1-x0<.0001)continue;
      const intervals=rects.filter(r=>r.x0<mx&&r.x1>mx)
        .map(r=>[r.z0,r.z1]).sort((a,b)=>a[0]-b[0]);
      const merged=[];
      for(const [z0,z1] of intervals){
        const last=merged[merged.length-1];
        if(last&&z0<=last[1]+.00001)last[1]=Math.max(last[1],z1);
        else merged.push([z0,z1]);
      }
      for(const [z0,z1] of merged)
        flat(mx,(z0+z1)/2,x1-x0+.001,z1-z0+.001,elevation,material);
    }
  }
  unionFloor(liftSpans,basic(routeColors.lift,.23),y+.022);
  unionFloor(pathSpans,basic(routeColors.walk),y+.037);

  // Symbols replace repeated route arrows. Keep pedestrian and vehicle icons
  // away from doors, parking spaces and the marked chemical loading crossing.
  for(const z of [-39.6,-32.9,-24.2,-16.0,-8.6,-1.5,7.35])
    floorSymbol("pedestrian",-29.13,z,.87);
  for(const x of [-23.5,-16.7,-9.9,-3.1,3.5,15.0])
    floorSymbol("pedestrian",x,-35.36,.87,Math.PI/2);
  for(const [x,z] of [[-24.45,4.35],[-25.45,-6.43],[-26.44,-28.15]])
    floorSymbol("pedestrian",x,z,.70,Math.PI/2);

  // Aisles (horizontal): evenly spaced, sparse, centerline floor icons.
  for(const z of [-4.45,-10.41,-16.84,-25.55,-33.04])
    for(const x of [-18,-2,16])
      floorSymbol("forklift",x,z,1.13,Math.PI/2);
  // Longitudinal truck lane to the right of the racking.
  for(const z of [-28.5,-20.8,-13.2,-5.6,1.0])
    floorSymbol("forklift",24.14,z,1.16);
  // Icons above the two receiving docks mark movement, never storage positions.
  for(const x of [-15.2,-3.6,8.5])
    floorSymbol("forklift",x,3.28,1.10,Math.PI/2);
  floorSymbol("forklift",31.1,7.3,1.05,Math.PI/2);

  // One zebra where the personnel corridor crosses the chemical loading path.
  // Stripes are perpendicular to the vehicle direction and stay on the crossing.
  for(const z of [-35.84,-35.60,-35.36,-35.12,-34.88])
    flat(8.78,z,5.12,.095,y+.050,white);

  // Minimal yellow lane delineation; no orphaned parallel cross-hatches.
  for(const z of [-17.98,-15.70,-26.68,-24.40])
    brokenLine(-.90,z,48.5,.049,y+.031,lane);
  for(const x of [21.93,26.37])
    brokenLine(x,-12.50,.055,38.5,y+.031,lane);

  // Physical protective rails with actual clearance at work-area accesses.
  rail(-27.85,9.94,-27.85,5.04,floor,.87);
  rail(-27.85,5.04,-21.57,5.04,floor,.87);
  rail(-21.57,3.63,-21.57,5.04,floor,.87);
  // The rail's deliberate opening lets staff leave the green walkway.
  for(const [a,b] of [[-.75,-1.40],[-2.84,-5.72],[-7.09,-26.95],[-29.36,-34.58],[-36.11,-43.35]])
    rail(-27.76,a,-27.76,b,floor,.87);
  for(const [x0,x1] of [[-23.3,-18.0],[-13.8,-8.5],[-2.2,3.0],[14.2,18.7]])
    rail(x0,-34.69,x1,-34.69,floor,.74);
  for(const [x,z] of [[21.70,-16.15],[-12.08,-17.82],[21.65,-30.89],[-26.72,-31.4],[-4.32,-35.78],[27.01,-28.01]]){
    box(scene,x,floor+1.66,z,.134,3.30,.145,C.steel);
    post(x-.21,floor,z+.09,.84);post(x+.21,floor,z+.09,.84);
  }
  const mirror=group(scene,21.6,floor,-24.70);
  box(mirror,0,1.18,0,.058,2.36,.064,C.steel);
  cyl(mirror,0,2.32,.081,.23,.07,C.orange).rotation.x=Math.PI/2;
  cyl(mirror,0,2.32,.132,.195,.04,"#9bc2c6").rotation.x=Math.PI/2;
  sign(22.0,floor+1.48,-15.75,.43,.36,"5",ink,white);

  // Two aligned inbound rows:
  // DOCKS -> RECEIVING | INSPECTION -> (cross aisle)
  //           PUTAWAY STAGING | gated QUARANTINE -> STORAGE
  // Muted distinct accents visually separate functions, not warehouse statuses.
  const inboundAccents={
    11:{edge:"#628ea1",title:"#315d6f"},
    12:{edge:"#ac9162",title:"#795e34"},
    13:{edge:"#6f9980",title:"#406d50"},
    14:{edge:"#77737a",title:"#55545b"}
  };
  for(const zone of zones){
    const [x,z,w,d]=boundsBox(zone.bounds);
    if(![1,2,3,4,5,9,10].includes(zone.id)){
      const accent=inboundAccents[zone.id];
      flat(x,z,w,d,y+.012,basic(zone.color,accent ? .90 : 1));
      outline(x,z,w,d,y+.019,accent ? accent.edge : white,accent ? .085 : .055);
      const title=labels[zone.id];
      if(accent){
        // One narrow header strip with enough contrast for an overhead camera.
        flat(x,z+d/2-.225,w-.25,.33,y+.028,basic("#f0f0e9",.93));
        groundText(x,z+d/2-.225,Math.min(w*.83,Math.max(3.0,title.length*.26)),.28,title,accent.title,y+.052);
      }else if(title){
        groundText(x,z+d/2-.25,Math.min(w*.92,title.length*.268),.36,title,ink,y+.050);
      }
    }
  }
  // Entrance, receiving office and numbered dock bays.
  const [officeLeft,officeRight,officeBack,officeFront]=receiving.office;
  const [officeX,officeZ,officeWidth,officeDepth]=boundsBox(receiving.office);
  flat(officeX,officeZ,officeWidth,officeDepth,y+.012,"#ddd6c2");
  for(const x of [officeLeft,officeRight])wallStrip(x,officeZ,.16,officeDepth,.87);
  for(const [x0,x1] of [[officeLeft,-29.95],[-28.46,officeRight]])wallStrip((x0+x1)/2,officeBack,x1-x0,.17,.92);
  for(const [x0,x1] of [[officeLeft,-23.13],[-21.78,officeRight]])wallStrip((x0+x1)/2,officeFront,x1-x0,.17,.92);
  box(scene,-26.03,floor+1.09,officeFront,2.92,.11,.32,C.steel);
  box(scene,-26.03,floor+1.19,officeFront-.03,2.61,.065,.22,"#d7bd90");
  doorway(receiving.driverDoorX,9.94,0,"ENTRANCE",{w:1.26});
  doorway(-29.21,officeBack,Math.PI,null,{w:1.17,color:"#76969a"});
  doorway(-22.455,officeFront,0,null,{w:1.12,color:"#76969a"});
  // Visitor equipment is shallow wall-mounted furniture beside the entrance.
  const ppe=group(scene,-30.61,floor,6.66);
  ppe.rotation.y=Math.PI/2;
  for(const x of [-1.91,1.91])box(ppe,x,1.12,0,.06,2.20,.07,C.steel);
  const equipmentBacking=round(ppe,0,1.09,-.013,3.87,2.11,.052,.025,"#b6c6c0");
  equipmentBacking.userData.canvasLayer=2;
  for(const yy of [.18,.59,1.58]){
    round(ppe,-1.00,yy,.21,1.74,.055,.47,.019,"#d9d4bd");
    for(const x of [-1.70,-.30])box(ppe,x,yy-.13,.08,.035,.24,.19,C.steel);
  }
  for(const x of [-1.57,-1.00,-.43]){
    const helmet=cyl(ppe,x,1.64,.21,.229,.045,"#f4d566");
    helmet.scale.z=1.12;
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.196,20,12,0,Math.PI*2,0,Math.PI/2),tools.mat("#f2cc52"));
    dome.position.set(x,1.655,.20);
    dome.scale.set(1,.87,1.09);
    dome.castShadow=true;
    ppe.add(dome);
    round(ppe,x,1.80,.20,.040,.045,.28,.018,"#ffe18b");
    for(const yy of [.24,.65])for(const offset of [-.115,.115]){
      round(ppe,x+offset,yy,.26,.15,.112,.33,.038,C.dark);
      round(ppe,x+offset,yy+.109,.18,.136,.18,.153,.022,"#485a5d");
      box(ppe,x+offset,yy-.035,.27,.159,.039,.35,"#6b7872");
    }
  }
  box(ppe,.98,1.92,.055,1.64,.09,.09,C.steel);
  for(const [i,x] of [.40,.99,1.58].entries()){
    box(ppe,x,1.86,.113,.033,.14,.15,C.steel);
    const hook=cyl(ppe,x,1.81,.207,.035,.061,C.gray);
    hook.rotation.x=Math.PI/2;
    const hanger=group(ppe,x,1.68,.203);
    for(const direction of [-1,1]){
      const arm=box(hanger,direction*.105,-.042,0,.239,.024,.024,C.steel);
      arm.rotation.z=direction*-.38;
    }
    const vest=group(ppe,x,1.06,.225);
    vest.rotation.z=[-.045,.025,-.025][i];
    const cloth=i===1?"#efa447":"#c6d94f";
    for(const direction of [-1,1]){
      round(vest,direction*.133,0,0,.233,.68,.067,.041,cloth);
      round(vest,direction*.155,.365,-.006,.187,.19,.064,.023,cloth);
      box(vest,direction*.139,.25,.041,.061,.48,.014,"#e6edda");
    }
    for(const yy of [-.13,-.265])box(vest,0,yy,.047,.477,.054,.017,"#e6edda");
    box(vest,0,-.029,.041,.018,.61,.014,C.steel);
  }
  // Shared wall-mounted extinguisher with accessible sign.
  function fireExtinguisher(x,z,heading){
  const entranceFire=group(scene,x,floor,z);
  entranceFire.rotation.y=heading;
  round(entranceFire,0,1.13,0,.41,1.55,.055,.027,"#a9bdb8");
  box(entranceFire,0,.59,.092,.24,.054,.25,C.steel);
  cyl(entranceFire,0,.95,.187,.118,.65,"#bb4136");
  cyl(entranceFire,0,1.30,.187,.118,.08,"#c44a3c",.060);
  cyl(entranceFire,0,1.365,.187,.052,.06,C.steel);
  box(entranceFire,0,1.41,.187,.223,.039,.069,C.dark);
  box(entranceFire,.126,1.15,.192,.036,.37,.037,C.dark);
  const nozzle=box(entranceFire,.123,1.34,.208,.052,.13,.061,C.dark);
  nozzle.rotation.z=-.22;
  box(entranceFire,0,.98,.310,.151,.20,.018,"#f4ead7");
  graphic(entranceFire,0,1.91,.052,.40,.42,(ctx,w,h)=>{
    ctx.fillStyle="#bd3932";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#fff7e6";ctx.fillRect(w*.35,h*.34,w*.30,h*.47);
    ctx.fillRect(w*.40,h*.24,w*.20,h*.10);
    ctx.fillRect(w*.33,h*.19,w*.37,h*.06);
    ctx.strokeStyle="#fff7e6";ctx.lineWidth=w*.044;
    ctx.beginPath();ctx.moveTo(w*.67,h*.29);ctx.lineTo(w*.79,h*.37);ctx.lineTo(w*.79,h*.62);ctx.stroke();
  });

  }
  doorway(-29.13,-43.72,Math.PI,"ВЫХОД");
  sign(-25.79,floor+.76,3.80,2.94,.34,"RECEIVING OFFICE");
  const office=table(-26.04,floor,2.54,3.30,1.02);
  const workstation=group(office,.42,0,.04);
  workstation.rotation.y=Math.PI;
  computer(workstation,0,0);
  printer(office,-.97,-.15,"A4");
  const chair=group(scene,-25.62,floor,1.58);
  cyl(chair,0,.315,0,.048,.49,C.steel);
  for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5;
    const arm=box(chair,Math.sin(angle)*.18,.081,Math.cos(angle)*.18,.051,.046,.39,C.steel);
    arm.rotation.y=angle;
    const caster=cyl(chair,Math.sin(angle)*.34,.060,Math.cos(angle)*.34,.061,.060,C.dark);
    caster.rotation.z=Math.PI/2;
  }
  round(chair,0,.58,0,.59,.12,.56,.070,C.navy);
  round(chair,0,.96,-.24,.56,.66,.095,.066,C.navy);
  for(const x of [-.32,.32]){
    box(chair,x,.74,-.04,.038,.31,.037,C.steel);
    round(chair,x,.88,.03,.070,.052,.37,.018,C.dark);
  }
  round(chair,0,.96,.02,.46,.52,.27,.081,"#69988b");
  box(chair,0,.91,.161,.41,.040,.012,C.white);
  cyl(chair,0,1.33,.047,.116,.23,"#b48b74");
  cyl(chair,0,1.47,.047,.157,.048,C.white);
  cyl(chair,0,1.52,.047,.141,.077,C.white,.108);
  for(const x of [-.135,.135]){
    round(chair,x,.605,.24,.18,.19,.51,.052,C.navy);
    round(chair,x,.34,.44,.17,.47,.19,.040,C.navy);
    round(chair,x,.095,.53,.205,.14,.34,.041,C.dark);
    const upperArm=round(chair,x*2.02,.98,.13,.119,.32,.136,.032,"#69988b");
    upperArm.rotation.x=-.20;
    round(chair,x*1.86,1.04,.365,.117,.115,.39,.033,"#69988b");
    round(chair,x*1.86,1.08,.575,.112,.073,.12,.026,"#b48b74");
  }
  // Rear wall of reception office, exterior-facing dashboard for daily huddles.
  const sqcd=group(scene,-25.72,floor,-.93);
  sqcd.rotation.y=Math.PI;
  for(const x of [-1.85,1.85])box(sqcd,x,1.48,-.045,.055,2.44,.075,C.steel);
  round(sqcd,0,1.72,0,4.04,1.72,.11,.052,C.navy);
  const dashboard=graphic(sqcd,0,1.72,.064,3.87,1.56,(ctx,w,h)=>{
    ctx.fillStyle="#f2f5ef";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#263b49";ctx.fillRect(0,0,w,h*.20);
    ctx.textBaseline="middle";
    ctx.font="800 "+Math.round(h*.098)+"px Inter, sans-serif";
    ctx.fillStyle="#ffffff";ctx.fillText("SQCD",w*.035,h*.10);
    ctx.textAlign="right";ctx.font="600 "+Math.round(h*.044)+"px Inter, sans-serif";
    ctx.fillText("RECEIVING  /  DAILY BOARD",w*.96,h*.10);
    const cards=[
      {letter:"S",name:"SAFETY",value:"0",unit:"INCIDENTS",color:"#4a8c78",bars:[.33,.27,.32,.25,.20]},
      {letter:"Q",name:"QUALITY",value:"99.2%",unit:"ACCEPTANCE",color:"#4a8c78",bars:[.71,.77,.75,.81,.86]},
      {letter:"C",name:"COST",value:"98%",unit:"BUDGET",color:"#4a8c78",bars:[.62,.59,.64,.61,.58]},
      {letter:"D",name:"DELIVERY",value:"96%",unit:"ON TIME",color:"#bd9145",bars:[.62,.69,.73,.79,.76]},
    ];
    cards.forEach((card,i)=>{
      const left=w*(.027+i*.244),width=w*.224;
      ctx.fillStyle="#e2e9e1";ctx.fillRect(left,h*.25,width,h*.62);
      ctx.fillStyle=card.color;ctx.fillRect(left,h*.25,width,h*.028);
      ctx.textAlign="center";ctx.fillStyle="#29434b";
      ctx.font="800 "+Math.round(h*.14)+"px Inter, sans-serif";ctx.fillText(card.letter,left+width/2,h*.37);
      ctx.font="700 "+Math.round(h*.044)+"px Inter, sans-serif";ctx.fillText(card.name,left+width/2,h*.48);
      ctx.font="800 "+Math.round(h*.10)+"px Inter, sans-serif";ctx.fillText(card.value,left+width/2,h*.59);
      ctx.font="600 "+Math.round(h*.035)+"px Inter, sans-serif";ctx.fillText(card.unit,left+width/2,h*.68);
      card.bars.forEach((bar,j)=>{ctx.fillStyle=card.color;ctx.fillRect(left+width*(.16+j*.145),h*.84-h*.14*bar,width*.09,h*.14*bar);});
    });
    ctx.fillStyle="#516a6a";ctx.textAlign="left";ctx.font="600 "+Math.round(h*.037)+"px Inter, sans-serif";
    ctx.fillText("DEMO VALUES · UPDATE AT SHIFT START",w*.035,h*.943);
  });
  dashboard.userData.canvasSortAnchor=new THREE.Vector3(0,1.72,.077);

  // Second panel to allocate shifts and record hazards, owners and blockers.
  const planBoard=group(scene,-22.62,floor,-.93);
  planBoard.rotation.y=Math.PI;
  for(const x of [-.80,.80])box(planBoard,x,1.46,-.055,.052,2.38,.075,C.steel);
  round(planBoard,0,1.72,0,1.84,1.74,.090,.040,C.navy);
  const today=graphic(planBoard,0,1.72,.064,1.68,1.58,(ctx,w,h)=>{
    ctx.fillStyle="#f3f5ef";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#263b49";ctx.fillRect(0,0,w,h*.19);
    ctx.textAlign="left";ctx.textBaseline="middle";
    ctx.fillStyle="#ffffff";ctx.font="800 "+Math.round(h*.09)+"px Inter,sans-serif";
    ctx.fillText("TODAY / SHIFT",w*.05,h*.095);
    const rows=[
      ["1","SAFETY / PPE","#458a73"],
      ["2","RECEIVING / WORK","#547b90"],
      ["3","TASKS / OWNERS","#547b90"],
      ["4","ISSUES / ESCALATE","#b4834e"]
    ];
    rows.forEach(([num,title,color],i)=>{
      const y=h*(.215+i*.173);
      ctx.fillStyle=i%2?"#e6eae4":"#dae5de";ctx.fillRect(w*.04,y,w*.92,h*.152);
      ctx.fillStyle=color;ctx.fillRect(w*.04,y,w*.070,h*.152);
      ctx.fillStyle="#ffffff";ctx.font="800 "+Math.round(h*.040)+"px Inter,sans-serif";
      ctx.textAlign="center";ctx.fillText(num,w*.075,y+h*.077);
      ctx.textAlign="left";ctx.fillStyle="#29434b";ctx.font="700 "+Math.round(h*.046)+"px Inter,sans-serif";
      ctx.fillText(title,w*.14,y+h*.05);
      ctx.strokeStyle="#98aaa5";ctx.lineWidth=Math.max(1,h*.004);
      ctx.beginPath();ctx.moveTo(w*.14,y+h*.112);ctx.lineTo(w*.91,y+h*.112);ctx.stroke();
    });
    ctx.fillStyle="#526665";ctx.font="600 "+Math.round(h*.039)+"px Inter,sans-serif";
    ctx.fillText("PLAN  ·  OWNER  ·  DUE",w*.05,h*.96);
  });
  today.userData.canvasSortAnchor=new THREE.Vector3(0,1.72,.079);
  // Tier-1 briefing footprint: outside office, apart from the forklift aisle,
  // open from the pedestrian corridor through the gap in the guardrail.
  flat(-24.96,-2.15,4.60,2.34,y+.043,basic("#cbd4ca"));
  outline(-24.96,-2.15,4.60,2.34,y+.047,"#e2e9df",.046);
  groundText(-24.96,-3.07,2.38,.32,"5 MIN · DAILY HUDDLE","#45625d",y+.057);
  // A sample shift team standing at the front-line visual board.
  for(const [x,color] of [
    [-26.64,"#85aba0"],[-25.78,"#b5a46d"],[-24.92,"#8eaaa9"],[-24.06,"#92aa95"]
  ]){const p=person(x,floor,-2.28,color);p.rotation.y=0;}
  const teamLead=person(-23.18,floor,-1.46,"#518f94");
  teamLead.rotation.y=Math.PI;
  sign(-25.15,floor+2.88,-.96,3.20,.32,"SHIFT START · 5 MIN",white,C.navy,Math.PI);
  function dock(x,z,num,heading=0,inner=false){
    const d=group(scene,x,floor,z);d.rotation.y=heading;
    const wide=inner?3.72:4.45;
    for(const side of [-1,1]){
      const dx=(wide/2+.10)*side;
      round(d,dx,1.31,.00,.26,2.62,.27,.035,C.navy);
      for(const yy of [.43,1.71])box(d,dx,yy,.152,.163,.29,.036,C.yellow);
      round(d,side*(wide*.47),.15,.215,.33,.28,.20,.035,C.dark);
    }
    round(d,0,2.70,-.008,wide+.45,.18,.36,.042,C.steel);
    for(let row=0;row<9;row++)box(d,0,.20+row*.253,-.057,wide,.241,.091,row%2?"#9db3ba":"#b5c8ca");
    for(const dx of [-(wide*.30),0,wide*.30])box(d,dx,1.71,.008,.63,.163,.056,"#719aa4");
    label(d,0,2.965,.040,Math.min(wide,2.63),.39,num,white,C.navy);
    box(d,0,.037,-.51,wide*.84,.067,1.14,C.steel);
    for(let i=0;i<11;i++)box(d,(i-5)*wide*.071,.075,-1.06,.19,.012,.108,C.yellow);
    if(!inner){
      box(d,wide*.65,1.47,.18,.19,.52,.112,C.dark);
      for(const [i,c] of ["#ce7765","#75bd96"].entries())cyl(d,wide*.65,1.57-i*.23,.252,.065,.038,c).rotation.x=Math.PI/2;
      box(d,-wide*.65,1.11,-.17,.162,.285,.08,C.navy);
      for(const [i,c] of [C.red,C.green,C.yellow].entries())box(d,-wide*.65,1.195-i*.077,-.22,.07,.036,.027,c);
    }
    return d;
  }
  for(const [i,x] of receiving.docks.entries()){
    dock(x,9.88,"ВОРОТА "+(i+1));
    for(const offset of [-2.68,2.68])post(x+offset,floor,9.02,1.04);
    outline(x,14.08,5.65,7.44,.031,white,.068);
    floorSymbol("forklift",x,15.35,1.25);
  }
  // Compact protected 5S dock service niche, BETWEEN the two door openings.
  // Only dock accessories belong here; no pallets or equipment are left on
  // the maneuvering apron in front of the docks.
  flat(-3.91,8.37,7.10,2.20,y+.026,basic("#b1b9b4",.32));
  outline(-3.91,8.37,7.10,2.20,y+.034,"#e8e9df",.044);
  // Slim cabinet on the wall: forms, small service tools, inspection log.
  const dockCabinet=group(scene,-3.94,floor,9.24);
  round(dockCabinet,0,.78,0,1.30,1.45,.43,.044,"#819194");
  round(dockCabinet,0,.82,-.23,1.19,1.30,.038,.018,"#aabcb9");
  box(dockCabinet,.45,.87,-.258,.032,.19,.016,C.steel);
  sign(-3.94,floor+1.95,9.53,2.60,.32,"DOCK SERVICE",white,C.navy,Math.PI);
  // Dedicated returns for dock 1 and dock 2; chocks are stored in holders
  // rather than loose on the floor, avoiding trip hazards.
  for(const [i,x] of [-6.30,-1.57].entries()){
    const stand=group(scene,x,floor,8.62);
    box(stand,0,.055,0,1.12,.10,.70,C.steel);
    box(stand,0,.66,.27,1.16,1.20,.075,C.steel);
    box(stand,0,.56,-.08,.99,.085,.45,C.dark);
    box(stand,0,.96,.23,1.00,.045,.18,C.yellow);
    for(const dx of [-.26,.26]){
      const chock=group(stand,dx,.615,-.09);
      box(chock,0,.043,0,.34,.076,.32,C.dark);
      const wedge=box(chock,0,.14,.055,.31,.175,.205,C.yellow);
      wedge.rotation.x=-.34;
      box(chock,0,.25,-.08,.21,.028,.04,C.dark);
    }
    sign(x,floor+1.43,8.93,.96,.25,"DOCK "+(i+1),white,C.navy,Math.PI);
  }
  // Minimal fixed housekeeping point next to the central cabinet.
  // Broom and dustpan are secured to the wall and do not occupy the aisle.
  for(const x of [-4.62,-4.40]){
    const handle=cyl(scene,x,floor+1.17,9.54,.022,1.46,"#c2ae85");
    handle.castShadow=true;
    box(scene,x,floor+.41,9.53,.18,.14,.07,C.steel);
  }
  forklift(receiving.truckFork,floor,7.52,0);
  // Seated narrow-aisle reach truck, matching the supplied photo.
  const stacker=reachTruck(receiving.stacker,floor,7.51,0);
  stacker.scale.setScalar(.90); // parked inside the original receiving footprint
  // Two manual pallet trucks: retained as compact procedural models.
  for(const x of [-22.06,-20.05]){
    outline(x,7.60,1.28,2.50,y+.023,white,.047);
    trolley(x,floor,7.92,false).rotation.y=Math.PI;
  }
  // No D01-D06 bays, pallets or storage markings in the receiving drive aisle.
  // Side charging room and equipment.
  wallStrip(38.37,5.15,.18,9.53,1.02);
  wallStrip(33.09,.66,10.62,.185,1.04);
  wallStrip(33.23,9.91,10.46,.17,.63);
  doorway(28.03,2.27,Math.PI/2,"ЗАРЯДНАЯ",{w:1.13});
  dock(28.24,7.25,"ВОРОТА ЗАРЯДНОЙ",Math.PI/2,true);
  for(const [i,x] of charging.postX.entries()){
    const unit=group(scene,x,floor,charging.postZ);
    round(unit,0,.13,0,1.28,.24,.88,.054,C.steel);
    round(unit,0,.79,0,1.12,1.42,.71,.12,"#6f828a");
    round(unit,0,1.075,.359,.92,.64,.103,.05,C.navy);
    round(unit,-.10,1.19,.421,.44,.214,.024,.02,"#5d96a1");
    cyl(unit,.245,1.23,.428,.052,.035,C.mint).rotation.x=Math.PI/2;
    cyl(unit,.245,1.03,.428,.042,.032,C.yellow).rotation.x=Math.PI/2;
    label(unit,-.08,.979,.438,.46,.136,"ПОСТ 0"+(i+1),white,C.navy);
    for(const hh of [.37,.43,.49])box(unit,-.145,hh,.364,.42,.018,.028,C.steel);
    const coil=new THREE.Mesh(new THREE.TorusGeometry(.253,.031,8,18),tools.mat(C.dark));
    coil.position.set(.60,.51,.36);
    coil.castShadow=true;
    unit.add(coil);
    round(unit,.625,.687,.419,.17,.095,.125,.02,C.gray);
    round(unit,.635,.719,.450,.091,.155,.09,.014,C.dark);
    for(const xx of [-.87,.87])post(x+xx,floor,2.02,.70,.065);
    outline(x,charging.parkingZ,charging.parkingWidth,charging.parkingDepth,y+.025,white,.068);
    groundText(x,charging.parkingZ+.63,2.16,.44,"МЕСТО 0"+(i+1));
    floorSymbol("forklift",x,charging.parkingZ+.07,.80);
  }
  brokenLine(33.08,6.20,9.46,.07,y+.021,lane);
  // Charging-bay access is identified by equipment icons, not road arrows.
  // Two compact workstations for the receiving row; no furniture in
  // the putaway or quarantine zones. Equipment belongs to its process area.
  const reception=table(-20.35,floor,-2.38,3.84,1.13);
  computer(reception,-1.00,-.26);
  printer(reception,.25,-.26,"ZEBRA");
  printer(reception,1.10,-.26,"A4");
  box(reception,.18,1.095,.34,.22,.063,.11,C.dark);      // scanner cradle
  box(reception,.38,1.105,.33,.08,.091,.18,C.steel);    // handheld scanner
  sign(-20.35,floor+1.28,-1.71,2.40,.29,"RECEIVING DESK");
  const scale=round(scene,-15.96,floor+.056,-2.43,1.35,.112,1.22,.036,C.gray);
  scale.userData.canvasLayer=3;
  groundText(-15.96,-1.69,1.08,.22,"SCALE",ink,y+.048);

  // The inspector works within INSPECTION, not on the opposite side of the aisle.
  const inspector=table(-.32,floor,-2.33,3.50,1.10);
  computer(inspector,-.87,-.25);
  lamp(inspector,1.14,-.22);
  box(inspector,.34,1.08,.20,.59,.037,.28,C.gray); // specimen tray
  for(const xx of [.16,.36,.56])box(inspector,xx,1.11,.20,.070,.048,.18,C.steel);
  sign(-.32,floor+1.27,-1.67,2.43,.29,"INSPECTION DESK");
  const toolCabinet=round(scene,2.55,floor+.67,-2.32,1.14,1.31,.63,.055,C.steel);
  toolCabinet.userData.canvasLayer=3;
  for(const xx of [2.27,2.83]){
    box(scene,xx,floor+.68,-1.992,.49,1.12,.036,"#aabcb8");
    box(scene,xx+.17,floor+.70,-1.970,.022,.10,.035,C.dark);
  }
  sign(2.55,floor+1.42,-1.95,1.30,.18,"MEASURING TOOLS",white,C.navy);

  // Slots use invented names for the teaching model, not a corporate WMS code.
  // Only a few sample pallets show how these areas are used.
  const inboundSlots=[
    {id:11,x:-8.35,z:-1.47,count:3,step:3.00,depth:2.10,code:"REC-",loaded:[1]},
    {id:12,x:12.00,z:-1.47,count:4,step:3.25,depth:2.10,code:"INS-",loaded:[1]},
    {id:13,x:-15.10,z:-7.45,count:5,step:3.40,depth:2.05,code:"PUT-",loaded:[0,3]},
    {id:14,x:7.60,z:-7.45,count:4,step:4.10,depth:2.05,code:"Q-",loaded:[2]}
  ];
  for(const cfg of inboundSlots){
    const color=inboundAccents[cfg.id].edge;
    bays(cfg.x,cfg.z,cfg.count,cfg.step,cfg.depth,cfg.code,color);
    for(const i of cfg.loaded)
      pallet(cfg.x+(i-(cfg.count-1)/2)*cfg.step,floor,cfg.z,i%4,true);
  }

  // Isolated quarantine fence on the second row. The entry is on the
  // forklift-aisle side, to the right of the last pallet position.
  // Keep the 3.2-unit access opening free of posts, signs, and stored loads.
  const q={left:-3.75,right:20.10,near:-5.60,far:-9.30,gate0:16.20,gate1:19.40};
  const fenceColor="#66747b";
  for(const [a,b] of [
    [[q.left,q.far],[q.right,q.far]],
    [[q.left,q.far],[q.left,q.near]],
    [[q.right,q.far],[q.right,q.near]],
    [[q.left,q.near],[q.gate0,q.near]],
    [[q.gate1,q.near],[q.right,q.near]]
  ])fence(...a,...b,fenceColor);
  // Guarded, clearly indicated side opening; nothing hangs across the gate.
  for(const xx of [q.gate0,q.gate1])post(xx,floor,q.near,.98,.07);
  sign(12.70,floor+1.48,-5.48,3.02,.33,"QUARANTINE",white,C.navy);

  // Main storage. Two groups of racks, plus a two-level mezzanine and a cantilever.
  function rack(x,z,w,d,title,kind="standard"){
    const std=kind==="standard",broken=kind==="broken",levels=[.41,1.57,2.66];
    const color=broken?"#bb7962":std?"#d4975d":"#c69861";
    for(const xx of [x-w/2,x+w/2]){
      for(const zz of [z-d/2,z+d/2]){
        box(scene,xx,floor+1.63,zz,.101,3.26,.101,C.steel);
        box(scene,xx,floor+.06,zz,.26,.12,.24,C.yellow);
      }
      box(scene,xx,floor+3.20,z,.083,.075,d+.02,C.steel);
    }
    for(const [i,tier] of levels.entries()){
      box(scene,x,floor+tier,z,w-.08,.065,d-.043,C.gray);
      for(const zz of [z-d/2,z+d/2])box(scene,x,floor+tier,zz,w+.04,.133,.108,color);
      for(const [j,dx] of [-.32,0,.31].entries()){
        if((std || broken) && ((i+j)%4!==3 || broken)){
          if(!std)pallet(x+dx*w,floor+tier+.042,z,(i+j+1)%4,false);
          if(std)pallet(x+dx*w,floor+tier+.042,z,(i+j+1)%4,true);
          if(broken){
            round(scene,x+dx*w,floor+tier+.35,z,.99,.35,.73,.045,["#759193","#a47f60","#6e8388"][j]);
            const cap=cyl(scene,x+dx*w,floor+tier+.36,z+.39,.20,.12,C.steel);cap.rotation.x=Math.PI/2;
            cyl(scene,x+dx*w,floor+tier+.36,z+.46,.086,.024,C.dark).rotation.x=Math.PI/2;
          }
        }
      }
    }
    sign(x,floor+3.23,z+d/2+.04,Math.min(w*.86,4.65),.36,title,white,broken?"#995a4c":C.navy);
  }
  for(const [i,x] of [-5.54,1.04,7.64].entries())rack(x,-21.52,6.37,2.23,i===0?"ОТРЕМОНТИРОВАННЫЕ":"НОВЫЕ ДЕТАЛИ");
  rack(-21.2,-40.9,6.65,2.75,"НЕИСПРАВНО","broken");rack(-11.93,-40.9,6.65,2.75,"НЕИСПРАВНО","broken");
  for(const xx of [13.64,17.06,20.36]){
    box(scene,xx,floor+1.44,-22.71,.15,2.86,.16,C.steel);
    for(const k of [.38,1.13,1.86,2.56]){
      box(scene,xx,floor+k,-21.71,.124,.076,2.22,C.gray);
      box(scene,xx,floor+k+.09,-20.60,.134,.20,.061,C.yellow);
    }
  }
  for(const [i,k] of [.51,1.22,1.95,2.65].entries())for(const [j,z] of [-22.02,-21.55,-21.03].entries()){
    const steel=cyl(scene,17.00,floor+k,z,.115+i*.018,7.35,j%2?C.steel:"#86a0a5");steel.rotation.z=Math.PI/2;
    const end=cyl(scene,20.69,floor+k,z,.072+i*.018,.026,C.dark);end.rotation.z=Math.PI/2;
  }
  sign(17.0, floor+3.012,-20.33,3.24,.36,"КОНСОЛЬНЫЙ СТЕЛЛАЖ");
  for(const xx of [-21.36,-17.77,-14.04])for(const zz of [-23.64,-19.15])box(scene,xx,floor+1.50,zz,.128,2.97,.128,C.steel);
  box(scene,-17.71,floor+2.17,-21.38,7.67,.162,4.60,C.gray);
  for(const [x1,z1,x2,z2] of [
    [-21.5,-23.66,-13.92,-23.66],[-13.92,-23.66,-13.92,-19.12],[-21.50,-19.12,-13.92,-19.12],
    [-21.50,-23.66,-21.50,-22.15],[-21.50,-20.61,-21.50,-19.12],
  ])rail(x1,z1,x2,z2,floor+2.26,.72);
  for(let i=0;i<12;i++)box(scene,-24.09+i*.261,floor+.17*(i+1),-21.38,.264,.095,1.38,C.yellow);
  for(const i of [0,3,6,9,11])for(const z of [-22.11,-20.64])box(scene,-24.09+i*.261,floor+.17*(i+1)+.39,z,.042,.79,.049,C.steel);
  for(const z of [-22.11,-20.64]){
    const stair=box(scene,-22.66,floor+1.40,z,3.7,.056,.049,C.yellow);stair.rotation.z=.58;
  }
  for(const yy of [.36,1.07,2.57])for(const z of [-22.88,-20.05]){
    box(scene,-17.60,floor+yy,z,6.65,.066,.69,C.steel);
    for(let j=0;j<8;j++)round(scene,-20.36+j*.80,floor+yy+.19,z,.59,.32,.54,.044,j%3?"#648fa7":"#81a9b6");
  }
  sign(-17.7,floor+3.12,-19.02,2.54,.38,"МЕЗОНИН · 2 УРОВНЯ");

  // Packing and dispatch behind the storage aisle.
  const pack=table(-5.01,floor,-29.49,7.03,1.58);
  printer(pack,-2.38,-.37,"A4");printer(pack,-1.52,-.34,"ZEBRA");computer(pack,-.50,-.33);
  const roll=cyl(pack,1.48,1.10,.22,.098,.45,"#e7dbb9");roll.rotation.z=Math.PI/2;
  box(pack,2.35,1.29,-.094,1.02,.52,.69,"#c09a70");
  for(const [index,color] of [C.orange,C.steel,C.green].entries())box(pack,.47+.223*index,1.081,.32,.17,.047,.23,color);
  sign(-5.06,floor+1.23,-28.54,2.47,.32,"СТОЛ УПАКОВКИ");
  person(-3.45,floor,-30.50,"#79a397");
  for(const [x,variant] of [[6.3,0],[7.88,2]])pallet(x,floor,-29.58,variant,true);
  for(let i=0;i<6;i++)pallet(11.33,floor+i*.154,-29.29,i,false);
  for(const x of [9.23,9.77])cyl(scene,x,floor+.67,-29.99,.192,1.25,"#e0d9bb");
  let dispatchNumber=0;
  for(const z of dispatch.parkingZ)for(const x of dispatch.parkingX){
    dispatchNumber++;
    outline(x,z,2.10,1.62,y+.024,white,.053);
    groundText(x,z+.61,1.17,.30,"S0"+dispatchNumber);
    if(dispatchNumber<4)pallet(x,floor,z,dispatchNumber);
  }
  dock(27.7,-29.12,"ВОРОТА ОТГРУЗКИ",Math.PI/2,true);
  doorway(27.86,-25.68,Math.PI/2,"ОТГРУЗКА",{w:1.19});
  for(const z of [-31.88,-26.39])post(26.89,floor,z,1.04);
  forklift(-23.54,floor,-28.75,Math.PI);
  const parked=reachTruck(-21.03,floor,-28.64,0);
  parked.scale.setScalar(.82); // fits the existing marked parking bay
  for(const x of [-18.95,-17.02])trolley(x,floor,-28.74,false);
  for(const x of [-23.54,-21.03,-18.95,-17.02,-14.62,-12.94])outline(x,-28.91,1.49,2.92,y+.025,white,.051);
  for(let i=0;i<5;i++)box(scene,-14.63,floor+.18*(i+1),-28.29-i*.28,.89,.085,.30,C.yellow);
  rail(-15.16,-29.62,-15.16,-28.09,floor,.88);rail(-14.10,-29.62,-14.10,-28.09,floor,.88);
  round(scene,-12.78,floor+.50,-28.96,1.0,.45,.76,.044,C.orange);
  for(const x of [-13.11,-12.44])cyl(scene,x,floor+.14,-28.61,.105,.083,C.dark).rotation.x=Math.PI/2;

  // Interior chemical room with an open-top cutaway of its equipment.
  for(const z of [-42.2,-38.22])wallStrip(-5.99,z,.19,3.96,1.33);
  for(const [x,w] of [[-.11,11.35],[16.23,9.40],[25.62,4.30]])wallStrip(x,-35.93,w,.19,1.27);
  dock(8.79,-35.96,"ВОРОТА ХИМСКЛАДА",0,true);
  doorway(21.51,-35.95,0,"ДВЕРЬ",{w:1.02});
  for(const x of [6.35,11.19])post(x,floor,-35.18,1.06);
  function drum(x,height,z,material){
    cyl(scene,x,height+.32,z,.240,.63,material);
    for(const yy of [.051,.29,.55])cyl(scene,x,height+yy,z,.249,.034,"#879693");
    box(scene,x,height+.32,z+.24,.20,.19,.014,white);
  }
  for(const [i,x] of [-1.80,4.35,10.51].entries()){
    rack(x,-41.32,5.64,2.33,["ПАЛЛЕТНЫЕ МЕСТА","ГРУППА A","ГРУППА B"][i],"chemical");
    for(const tier of [.452,1.612,2.702])for(const dx of [-1.42,1.42]){
      pallet(x+dx,floor+tier,-41.28,i,false);
      for(const shift of [-.28,.28])drum(x+dx+shift,floor+tier+.183,-41.28,["#9baba9","#5b8d98","#c3a070"][i]);
    }
  }
  for(const x of [14.99,18.13])for(const z of [-41.71,-40.57])box(scene,x,floor+1.11,z,.088,2.22,.09,C.steel);
  for(const yy of [.28,.96,1.65]){
    box(scene,16.60,floor+yy,-41.15,3.21,.065,1.21,C.steel);
    for(const x of [15.40,16.18,16.96,17.74])round(scene,x,floor+yy+.196,-41.06,.62,.30,.72,.039,"#638fa7");
  }
  sign(16.55,floor+2.26,-40.48,1.24,.29,"ЛОТКИ");
  round(scene,21.84,floor+1.16,-41.67,2.42,2.29,.96,.057,"#a6bdc0");
  for(const x of [21.23,22.44]){
    round(scene,x,floor+1.20,-41.163,1.14,2.13,.094,.034,"#d7e3df");
    box(scene,x+.30,floor+1.12,-41.10,.059,.33,.057,C.steel);
  }
  sign(21.84,floor+2.36,-41.03,2.23,.29,"ТЕМПЕРАТУРНЫЙ ШКАФ");
  sign(25.75,floor+1.99,-42.10,2.49,.69,"SDS · СОВМЕСТИМОСТЬ",ink,"#ead8af");
  for(const x of [24.78,25.74,26.70])for(const v of [1.24,.91,.61])box(scene,x,floor+v,-42.10,.77,.045,.031,"#b7a07e");
  sign(24.90,floor+1.52,-35.82,2.48,.34,"МАРКИРОВКА ПО SDS",ink,"#ead8af");

  // Concept positions for fire safety equipment, to be verified against the real
  // fire-risk assessment and extinguisher class/distance requirements.
  for(const [x,z,heading] of [
    [-30.64,4.24,Math.PI/2],     // entrance
    [-30.64,-12.10,Math.PI/2],   // inspection
    [-30.64,-25.10,Math.PI/2],   // mezzanine / racks
    [-30.64,-41.45,Math.PI/2],   // emergency exit
    [27.56,-19.50,-Math.PI/2],  // right-hand vehicle corridor
    [27.55,-38.25,-Math.PI/2],  // chemical-store interior
    [19.35,-35.68,0],          // chemical-room pedestrian door
    [37.94,1.21,-Math.PI/2],   // charging bay
  ])fireExtinguisher(x,z,heading);
  // One slim support for the charging station (no wall available there).
  box(scene,38.02,floor+1.02,1.21,.07,2.04,.07,C.steel);
  box(scene,38.02,floor+.025,1.21,.37,.05,.37,C.steel);
  post(-27.49,floor,-12.16,.77,.073);
  box(scene,-28.76,floor+1.22,-9.6,.41,.27,.15,"#e8ead7");
  sign(-28.76,floor+1.26,-9.49,.37,.23,"+", "#41755d","#ededdb");
  person(-29.22,floor,-3.18,"#74a495");

  const sun=new THREE.DirectionalLight("#fff1db",2.25);
  sun.position.set(-22,48,24);sun.target.position.set(0,0,-14);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-42,right:42,top:45,bottom:-43,near:1,far:126});
  sun.shadow.normalBias=.025;sun.shadow.bias=-.00025;
  scene.add(sun,sun.target,new THREE.HemisphereLight("#eaf5f2","#979d85",1.63));
  const fill=new THREE.DirectionalLight("#e0f1ff",.60);fill.position.set(34,17,-37);scene.add(fill);
  const context=canvas.getContext("webgl2",{antialias:true,alpha:true,powerPreference:"high-performance"});
  let renderer;
  if(context){
    renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:true});
    renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
  }else renderer=new SoftwareRenderer(canvas,new Set());
  return {scene,renderer};
}
